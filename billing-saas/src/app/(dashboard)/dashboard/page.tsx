import React, { Suspense } from "react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, startOfMonth, format } from "date-fns";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import DashboardLoading from "@/app/(dashboard)/loading";

export const dynamic = "force-dynamic";

async function DashboardData() {
  const tenant = await requireTenant();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const last7Start = startOfDay(subDays(now, 6));
  const currentMonthStart = startOfMonth(now);

  // Range should cover from the start of the current month OR the last 7 days, whichever is earlier
  const queryStartDate = currentMonthStart < last7Start ? currentMonthStart : last7Start;

  // Parallel DB queries using Promise.allSettled with targeted field selection for speed and resilience
  let rangeInvoices: any[] = [];
  let rangeExpenses: any[] = [];
  let recentBills: any[] = [];
  let recentExpenses: any[] = [];
  let allProducts: any[] = [];
  let rangeReturns: any[] = [];

  try {
    const results = await Promise.allSettled([
      // 1. Invoices for the query range (covers both 7-day chart & current month) with items & product cost prices
      prisma.invoice.findMany({
        where: {
          tenantId: tenant.id,
          invoiceDate: { gte: queryStartDate },
          status: { not: "CANCELLED" },
        },
        select: {
          id: true,
          invoiceNo: true,
          invoiceDate: true,
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
          paymentMode: true,
          payments: true,
          customerId: true,
          metadata: true,
          items: {
            select: {
              qty: true,
              price: true,
              total: true,
              product: {
                select: {
                  costPrice: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { invoiceDate: "desc" },
      }),

      // 2. Expenses for the query range
      prisma.expense.findMany({
        where: {
          tenantId: tenant.id,
          date: { gte: queryStartDate },
        },
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          createdAt: true,
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      }),

      // 3. Recent 5 invoices (any date) for Recent Bills list
      prisma.invoice.findMany({
        where: { tenantId: tenant.id },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNo: true,
          invoiceDate: true,
          totalAmount: true,
          paidAmount: true,
          balanceAmount: true,
          status: true,
          paymentMode: true,
          metadata: true,
          customer: {
            select: {
              id: true,
              name: true,
              mobile: true,
            },
          },
        },
      }),

      // 4. Recent 5 expenses (any date) for Recent Expenses list
      prisma.expense.findMany({
        where: { tenantId: tenant.id },
        take: 5,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          createdAt: true,
        },
      }),

      // 5. Active products for inventory & low stock alerts
      prisma.product.findMany({
        where: {
          tenantId: tenant.id,
          isActive: true,
        },
        select: {
          id: true,
          productId: true,
          name: true,
          stockQty: true,
          lowStockAlert: true,
        },
      }),

      // 6. Sales Returns for the query range
      prisma.salesReturn.findMany({
        where: {
          tenantId: tenant.id,
          returnDate: { gte: queryStartDate },
        },
        select: {
          id: true,
          totalAmount: true,
          refundMode: true,
          returnDate: true,
        },
      }),
    ]);

    if (results[0].status === "fulfilled") rangeInvoices = results[0].value;
    else console.warn("rangeInvoices query error:", results[0].reason);

    if (results[1].status === "fulfilled") rangeExpenses = results[1].value;
    else console.warn("rangeExpenses query error:", results[1].reason);

    if (results[2].status === "fulfilled") recentBills = results[2].value;
    else console.warn("recentBills query error:", results[2].reason);

    if (results[3].status === "fulfilled") recentExpenses = results[3].value;
    else console.warn("recentExpenses query error:", results[3].reason);

    if (results[4].status === "fulfilled") allProducts = results[4].value;
    else console.warn("allProducts query error:", results[4].reason);

    if (results[5].status === "fulfilled") rangeReturns = results[5].value;
    else console.warn("rangeReturns query error:", results[5].reason);
  } catch (error) {
    console.error("Dashboard queries error:", error);
  }

  // --- Filter Today's subset ---
  const todayInvoices = rangeInvoices.filter(
    (inv) => new Date(inv.invoiceDate) >= todayStart
  );

  const todayExpensesList = rangeExpenses.filter((exp) => {
    const d = new Date(exp.date);
    return d >= todayStart && d <= todayEnd;
  });

  const todayReturnsList = rangeReturns.filter((ret) => {
    const d = new Date(ret.returnDate);
    return d >= todayStart && d <= todayEnd;
  });

  // Today's Sales Breakdown (Cash vs Online UPI/Card)
  let todayCashSales = 0;
  let todayOnlineSales = 0;

  for (const inv of todayInvoices) {
    if (inv.status === "CANCELLED") continue;

    const payments = Array.isArray(inv.payments) ? (inv.payments as any[]) : null;

    if (payments && payments.length > 0) {
      for (const p of payments) {
        const amt = Number(p.amount || 0);
        if (p.mode === "CASH") {
          todayCashSales += amt;
        } else if (p.mode === "UPI" || p.mode === "CARD" || p.mode === "BANK_TRANSFER") {
          todayOnlineSales += amt;
        }
      }
    } else {
      const paid = Number(inv.paidAmount || 0);
      const total = Number(inv.totalAmount || 0);
      const amt =
        inv.paymentMode === "CREDIT" || inv.status === "UNPAID"
          ? paid
          : (paid > 0 ? paid : total);

      if (inv.paymentMode === "CASH") {
        todayCashSales += amt;
      } else if (
        inv.paymentMode === "UPI" ||
        inv.paymentMode === "CARD" ||
        inv.paymentMode === "BANK_TRANSFER"
      ) {
        todayOnlineSales += amt;
      }
    }
  }

  // Adjust today's sales for returns today
  const todayReturnsTotal = todayReturnsList.reduce(
    (sum, ret) => sum + Number(ret.totalAmount || 0),
    0
  );

  for (const ret of todayReturnsList) {
    const retAmt = Number(ret.totalAmount || 0);
    if (ret.refundMode === "CASH") {
      todayCashSales = Math.max(0, todayCashSales - retAmt);
    } else if (ret.refundMode === "UPI" || ret.refundMode === "CARD" || ret.refundMode === "BANK_TRANSFER") {
      todayOnlineSales = Math.max(0, todayOnlineSales - retAmt);
    } else {
      if (todayCashSales >= retAmt) {
        todayCashSales -= retAmt;
      } else {
        const remainder = retAmt - todayCashSales;
        todayCashSales = 0;
        todayOnlineSales = Math.max(0, todayOnlineSales - remainder);
      }
    }
  }

  todayCashSales = Math.round(todayCashSales * 100) / 100;
  todayOnlineSales = Math.round(todayOnlineSales * 100) / 100;
  const todaySale = Math.max(0, Math.round((todayCashSales + todayOnlineSales) * 100) / 100);

  // Today's Expense (₹)
  const todayExpense = Math.round(
    todayExpensesList.reduce((sum, exp) => sum + Number(exp.amount), 0) * 100
  ) / 100;

  // Today's Cost of goods sold (sum of item.costPrice * item.qty for today's invoices)
  let todayCost = 0;
  for (const inv of todayInvoices) {
    for (const item of inv.items) {
      const unitCost =
        item.product?.costPrice !== null && item.product?.costPrice !== undefined
          ? Number(item.product.costPrice)
          : 0;
      todayCost += unitCost * Number(item.qty);
    }
  }
  todayCost = Math.round(todayCost * 100) / 100;

  // Today's Profit Formula: (Today's Sales - Today's Cost of Goods) - Today's Expenses
  const todayProfit = Math.round(((todaySale - todayCost) - todayExpense) * 100) / 100;

  // --- Current Month Calculations (Task 2: Monthly Profit) ---
  const currentMonthInvoices = rangeInvoices.filter(
    (inv) => new Date(inv.invoiceDate) >= currentMonthStart && new Date(inv.invoiceDate) <= todayEnd
  );

  const currentMonthExpenses = rangeExpenses.filter((exp) => {
    const d = new Date(exp.date);
    return d >= currentMonthStart && d <= todayEnd;
  });

  const currentMonthReturns = rangeReturns.filter((ret) => {
    const d = new Date(ret.returnDate);
    return d >= currentMonthStart && d <= todayEnd;
  });

  let rawMonthSales = 0;
  for (const inv of currentMonthInvoices) {
    if (inv.status === "CANCELLED") continue;
    const payments = Array.isArray(inv.payments) ? (inv.payments as any[]) : null;
    if (payments && payments.length > 0) {
      for (const p of payments) {
        rawMonthSales += Number(p.amount || 0);
      }
    } else {
      const paid = Number(inv.paidAmount || 0);
      const total = Number(inv.totalAmount || 0);
      const amt =
        inv.paymentMode === "CREDIT" || inv.status === "UNPAID"
          ? paid
          : (paid > 0 ? paid : total);
      rawMonthSales += amt;
    }
  }

  const monthReturnsTotal = currentMonthReturns.reduce(
    (sum, ret) => sum + Number(ret.totalAmount || 0),
    0
  );
  const monthSale = Math.max(0, Math.round((rawMonthSales - monthReturnsTotal) * 100) / 100);

  let monthCost = 0;
  for (const inv of currentMonthInvoices) {
    if (inv.status === "CANCELLED") continue;
    for (const item of inv.items) {
      const unitCost =
        item.product?.costPrice !== null && item.product?.costPrice !== undefined
          ? Number(item.product.costPrice)
          : 0;
      monthCost += unitCost * Number(item.qty);
    }
  }
  monthCost = Math.round(monthCost * 100) / 100;

  const monthExpense = Math.round(
    currentMonthExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) * 100
  ) / 100;

  // Monthly Profit Formula: (Month's Sales - Month's Cost of Goods) - Month's Expenses
  const monthlyProfit = Math.round(((monthSale - monthCost) - monthExpense) * 100) / 100;

  // Today's Customers - Unique count of customers who bought today
  const uniqueCustomerKeys = new Set(
    todayInvoices.map(
      (inv) =>
        inv.customerId ||
        inv.customer?.name ||
        (inv.metadata as any)?.walkInCustomerName ||
        inv.id
    )
  );
  const todayCustomers = uniqueCustomerKeys.size;

  // Today's Udhari (₹)
  const todayUdhari = todayInvoices.reduce((sum, inv) => {
    if (inv.status === "UNPAID" || inv.paymentMode === "CREDIT" || Number(inv.balanceAmount) > 0) {
      return sum + Number(inv.balanceAmount);
    }
    return sum;
  }, 0);

  // Mini Charts Data: Last 7 Days Sales & Profit
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const dayDate = subDays(now, i);
    const dayStart = startOfDay(dayDate);
    const dayEnd = endOfDay(dayDate);
    const dateKey = format(dayDate, "yyyy-MM-dd");
    const label = format(dayDate, "dd MMM");
    const dayName = format(dayDate, "EEE");

    // Invoices for this day
    const dayInvoices = rangeInvoices.filter((inv) => {
      const d = new Date(inv.invoiceDate);
      return d >= dayStart && d <= dayEnd;
    });

    const daySales = dayInvoices.reduce((sum, inv) => {
      if (inv.paymentMode === "CREDIT" || inv.status === "UNPAID") {
        return sum + Number(inv.paidAmount || 0);
      }
      return sum + Number(inv.totalAmount);
    }, 0);

    let dayCost = 0;
    for (const inv of dayInvoices) {
      for (const item of inv.items) {
        const uCost =
          item.product?.costPrice !== null && item.product?.costPrice !== undefined
            ? Number(item.product.costPrice)
            : 0;
        dayCost += uCost * Number(item.qty);
      }
    }

    // Expenses for this day
    const dayExpenses = rangeExpenses.filter((exp) => {
      const d = new Date(exp.date);
      return d >= dayStart && d <= dayEnd;
    });
    const dayExpense = dayExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

    // Returns for this day
    const dayReturns = rangeReturns.filter((ret) => {
      const d = new Date(ret.returnDate);
      return d >= dayStart && d <= dayEnd;
    });
    const dayReturnAmount = dayReturns.reduce((sum, ret) => sum + Number(ret.totalAmount || 0), 0);

    const netDaySales = Math.max(0, daySales - dayReturnAmount);
    const dayProfit = Math.round(((netDaySales - dayCost) - dayExpense) * 100) / 100;

    last7DaysData.push({
      date: dateKey,
      label,
      dayName,
      sales: Math.round(netDaySales),
      profit: Math.round(dayProfit),
      cost: Math.round(dayCost),
      expense: Math.round(dayExpense),
    });
  }

  // Low stock alerts (strict check: stockQty <= lowStockAlert or <= 5)
  const lowStockAlerts = allProducts
    .filter(
      (p) =>
        p.stockQty !== null &&
        p.stockQty !== undefined &&
        Number(p.stockQty) <=
          Number(p.lowStockAlert !== null && p.lowStockAlert !== undefined ? p.lowStockAlert : 5)
    )
    .map((p) => ({
      id: p.id,
      productId: p.productId || null,
      name: p.name,
      stockQty: Number(p.stockQty),
      lowStockAlert: Number(
        p.lowStockAlert !== null && p.lowStockAlert !== undefined ? p.lowStockAlert : 5
      ),
    }));

  return (
    <DashboardClient
      tenant={{
        id: tenant.id,
        businessName: tenant.businessName,
        shopType: tenant.shopType,
        ownerName: tenant.ownerName,
        mobile: tenant.mobile,
      }}
      todaySale={todaySale}
      todayCashSales={todayCashSales}
      todayOnlineSales={todayOnlineSales}
      todayExpense={todayExpense}
      todayProfit={todayProfit}
      todayCost={todayCost}
      monthlyProfit={monthlyProfit}
      monthSale={monthSale}
      monthCost={monthCost}
      monthExpense={monthExpense}
      todayCustomers={todayCustomers}
      todayUdhari={todayUdhari}
      last7DaysData={last7DaysData}
      recentBills={recentBills.map((b) => ({
        id: b.id,
        invoiceNo: b.invoiceNo,
        invoiceDate: b.invoiceDate.toISOString(),
        totalAmount: Number(b.totalAmount),
        paidAmount: Number(b.paidAmount),
        balanceAmount: Number(b.balanceAmount),
        status: b.status,
        paymentMode: b.paymentMode,
        customerName:
          b.customer?.name || (b.metadata as any)?.walkInCustomerName || "Walk-in Customer",
      }))}
      recentExpenses={recentExpenses.map((e) => ({
        id: e.id,
        title: e.title,
        amount: Number(e.amount),
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
      }))}
      lowStockAlerts={lowStockAlerts}
    />
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardData />
    </Suspense>
  );
}
