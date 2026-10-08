import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export interface ReportsData {
  dateRange: {
    from: string;
    to: string;
  };
  sales: {
    summary: {
      totalRevenue: number;
      totalTax: number;
      totalDiscount: number;
      totalSubtotal: number;
      totalPaid: number;
      totalBalance: number;
      invoiceCount: number;
      averageBillValue: number;
    };
    timeline: Array<{
      date: string;
      label: string;
      revenue: number;
      invoices: number;
      paid: number;
      tax: number;
    }>;
    paymentModes: Array<{
      mode: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    statusBreakdown: {
      paid: { count: number; amount: number };
      partial: { count: number; amount: number };
      unpaid: { count: number; amount: number };
    };
    invoicesList: Array<{
      id: string;
      invoiceNo: string;
      invoiceDate: string;
      customerName: string;
      customerMobile: string;
      totalAmount: number;
      paidAmount: number;
      balanceAmount: number;
      paymentMode: string;
      status: string;
    }>;
  };
  gst: {
    summary: {
      totalTaxableAmount: number;
      totalTaxCollected: number;
      cgst: number;
      sgst: number;
      b2bCount: number;
      b2bTotal: number;
      b2bTax: number;
      b2cCount: number;
      b2cTotal: number;
      b2cTax: number;
    };
    slabs: Array<{
      rate: number;
      label: string;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      totalTax: number;
      totalAmount: number;
      itemCount: number;
    }>;
    gstr1Register: Array<{
      invoiceNo: string;
      invoiceDate: string;
      customerName: string;
      customerGstNo: string | null;
      taxableValue: number;
      taxAmount: number;
      cgst: number;
      sgst: number;
      totalAmount: number;
      invoiceType: "B2B" | "B2C";
    }>;
  };
  products: {
    summary: {
      totalItemsSold: number;
      totalProductRevenue: number;
      uniqueProductsCount: number;
      topProductName: string;
    };
    topProducts: Array<{
      name: string;
      category: string;
      quantitySold: number;
      revenue: number;
      averagePrice: number;
      unit: string;
      stockRemaining: number | null;
    }>;
    categories: Array<{
      category: string;
      revenue: number;
      quantitySold: number;
    }>;
  };
  customers: {
    summary: {
      totalCustomers: number;
      repeatCustomers: number;
      averageSpend: number;
      topCustomerName: string;
    };
    topCustomers: Array<{
      id: string | null;
      name: string;
      mobile: string;
      gstNo: string | null;
      invoicesCount: number;
      totalSpent: number;
      totalPaid: number;
      balance: number;
      lastVisit: string;
    }>;
  };
  profit: {
    summary: {
      totalRevenue: number;
      totalCost: number;
      grossProfit: number;
      marginPercentage: number;
      itemsWithCost: number;
      itemsWithoutCost: number;
    };
    dailyTimeline: Array<{
      date: string;
      label: string;
      revenue: number;
      cost: number;
      profit: number;
      margin: number;
    }>;
    productMargins: Array<{
      name: string;
      category: string;
      quantitySold: number;
      sellingPrice: number;
      costPrice: number;
      revenue: number;
      totalCost: number;
      grossProfit: number;
      marginPercentage: number;
      hasCost: boolean;
    }>;
  };
}

export async function generateReportsData(
  tenantId: string,
  from: Date,
  to: Date
): Promise<ReportsData> {
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      invoiceDate: {
        gte: from,
        lte: to,
      },
      status: { not: "CANCELLED" },
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          mobile: true,
          gstNo: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              category: true,
              costPrice: true,
              stockQty: true,
              unit: true,
            },
          },
        },
      },
    },
    orderBy: { invoiceDate: "asc" },
  });

  // 1. Sales Calculations
  let totalRevenue = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  let totalSubtotal = 0;
  let totalPaid = 0;
  let totalBalance = 0;

  const timelineMap = new Map<
    string,
    { date: string; label: string; revenue: number; invoices: number; paid: number; tax: number }
  >();

  const paymentModesMap = new Map<string, { amount: number; count: number }>();

  let paidStatusCount = 0;
  let paidStatusAmount = 0;
  let partialStatusCount = 0;
  let partialStatusAmount = 0;
  let unpaidStatusCount = 0;
  let unpaidStatusAmount = 0;

  // 2. GST Calculations
  let b2bCount = 0;
  let b2bTotal = 0;
  let b2bTax = 0;
  let b2cCount = 0;
  let b2cTotal = 0;
  let b2cTax = 0;

  const slabMap = new Map<
    number,
    { rate: number; taxableAmount: number; totalTax: number; totalAmount: number; itemCount: number }
  >();

  // 3. Products Calculations
  const productMap = new Map<
    string,
    {
      name: string;
      category: string;
      quantitySold: number;
      revenue: number;
      totalCost: number;
      unit: string;
      stockRemaining: number | null;
      costPrice: number;
      hasCost: boolean;
    }
  >();

  // 4. Customers Calculations
  const customerMap = new Map<
    string,
    {
      id: string | null;
      name: string;
      mobile: string;
      gstNo: string | null;
      invoicesCount: number;
      totalSpent: number;
      totalPaid: number;
      balance: number;
      lastVisit: Date;
    }
  >();

  // 5. Profit Calculations
  let totalCost = 0;
  let itemsWithCost = 0;
  let itemsWithoutCost = 0;
  const profitTimelineMap = new Map<
    string,
    { date: string; label: string; revenue: number; cost: number; profit: number }
  >();

  const invoicesList: ReportsData["sales"]["invoicesList"] = [];
  const gstr1Register: ReportsData["gst"]["gstr1Register"] = [];

  for (const inv of invoices) {
    const rev = Number(inv.totalAmount);
    const tax = Number(inv.taxAmount);
    const disc = Number(inv.discountAmount);
    const sub = Number(inv.subtotal);
    const paid = Number(inv.paidAmount);
    const bal = Number(inv.balanceAmount);

    totalRevenue += rev;
    totalTax += tax;
    totalDiscount += disc;
    totalSubtotal += sub;
    totalPaid += paid;
    totalBalance += bal;

    const dateKey = format(inv.invoiceDate, "yyyy-MM-dd");
    const dateLabel = format(inv.invoiceDate, "dd MMM");

    // Timeline grouping
    const currentTimeline = timelineMap.get(dateKey) || {
      date: dateKey,
      label: dateLabel,
      revenue: 0,
      invoices: 0,
      paid: 0,
      tax: 0,
    };
    currentTimeline.revenue += rev;
    currentTimeline.invoices += 1;
    currentTimeline.paid += paid;
    currentTimeline.tax += tax;
    timelineMap.set(dateKey, currentTimeline);

    // Payment mode grouping
    const modeKey = inv.paymentMode || "CASH";
    const currentMode = paymentModesMap.get(modeKey) || { amount: 0, count: 0 };
    currentMode.amount += rev;
    currentMode.count += 1;
    paymentModesMap.set(modeKey, currentMode);

    // Status breakdown
    if (inv.status === "PAID") {
      paidStatusCount += 1;
      paidStatusAmount += rev;
    } else if (inv.status === "PARTIAL") {
      partialStatusCount += 1;
      partialStatusAmount += rev;
    } else {
      unpaidStatusCount += 1;
      unpaidStatusAmount += rev;
    }

    const customerName =
      inv.customer?.name ||
      (inv.metadata as any)?.walkInCustomerName ||
      "Walk-in Customer";
    const customerMobile =
      inv.customer?.mobile ||
      (inv.metadata as any)?.walkInCustomerMobile ||
      "-";
    const customerGst = inv.customer?.gstNo || null;
    const isB2B = Boolean(customerGst && customerGst.trim().length > 5);

    if (isB2B) {
      b2bCount += 1;
      b2bTotal += rev;
      b2bTax += tax;
    } else {
      b2cCount += 1;
      b2cTotal += rev;
      b2cTax += tax;
    }

    invoicesList.push({
      id: inv.id,
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate.toISOString(),
      customerName,
      customerMobile,
      totalAmount: Math.round(rev * 100) / 100,
      paidAmount: Math.round(paid * 100) / 100,
      balanceAmount: Math.round(bal * 100) / 100,
      paymentMode: inv.paymentMode,
      status: inv.status,
    });

    gstr1Register.push({
      invoiceNo: inv.invoiceNo,
      invoiceDate: inv.invoiceDate.toISOString(),
      customerName,
      customerGstNo: customerGst,
      taxableValue: Math.round(sub * 100) / 100,
      taxAmount: Math.round(tax * 100) / 100,
      cgst: Math.round((tax / 2) * 100) / 100,
      sgst: Math.round((tax / 2) * 100) / 100,
      totalAmount: Math.round(rev * 100) / 100,
      invoiceType: isB2B ? "B2B" : "B2C",
    });

    // Customer grouping
    const custKey = inv.customerId || `${customerName}-${customerMobile}`;
    const custEntry = customerMap.get(custKey) || {
      id: inv.customerId,
      name: customerName,
      mobile: customerMobile,
      gstNo: customerGst,
      invoicesCount: 0,
      totalSpent: 0,
      totalPaid: 0,
      balance: 0,
      lastVisit: inv.invoiceDate,
    };
    custEntry.invoicesCount += 1;
    custEntry.totalSpent += rev;
    custEntry.totalPaid += paid;
    custEntry.balance += bal;
    if (inv.invoiceDate > custEntry.lastVisit) {
      custEntry.lastVisit = inv.invoiceDate;
    }
    customerMap.set(custKey, custEntry);

    // Items for GST, Products, and Profit
    let invoiceCost = 0;
    for (const item of inv.items) {
      const q = Number(item.qty);
      const p = Number(item.price);
      const itemTax = Number(item.taxAmount);
      const itemTaxRate = Number(item.taxRate) || 0;
      const itemRev = Number(item.total);
      const itemSub = q * p;

      // GST Slabs
      const slabKey = Math.round(itemTaxRate);
      const currentSlab = slabMap.get(slabKey) || {
        rate: slabKey,
        taxableAmount: 0,
        totalTax: 0,
        totalAmount: 0,
        itemCount: 0,
      };
      currentSlab.taxableAmount += itemSub;
      currentSlab.totalTax += itemTax;
      currentSlab.totalAmount += itemRev;
      currentSlab.itemCount += 1;
      slabMap.set(slabKey, currentSlab);

      // Cost price & profit
      const rawCost = item.product?.costPrice !== null && item.product?.costPrice !== undefined
        ? Number(item.product.costPrice)
        : null;
      const hasCost = rawCost !== null;
      const unitCost = hasCost ? rawCost : 0;
      const lineCost = q * unitCost;

      if (hasCost) {
        itemsWithCost += 1;
      } else {
        itemsWithoutCost += 1;
      }
      totalCost += lineCost;
      invoiceCost += lineCost;

      // Product Aggregation
      const prodKey = item.productId || item.name;
      const prodEntry = productMap.get(prodKey) || {
        name: item.name,
        category: item.product?.category || "General",
        quantitySold: 0,
        revenue: 0,
        totalCost: 0,
        unit: item.product?.unit || "pc",
        stockRemaining: item.product?.stockQty ? Number(item.product.stockQty) : null,
        costPrice: unitCost,
        hasCost,
      };
      prodEntry.quantitySold += q;
      prodEntry.revenue += itemRev;
      prodEntry.totalCost += lineCost;
      productMap.set(prodKey, prodEntry);
    }

    // Profit timeline
    const profitLine = profitTimelineMap.get(dateKey) || {
      date: dateKey,
      label: dateLabel,
      revenue: 0,
      cost: 0,
      profit: 0,
    };
    profitLine.revenue += rev;
    profitLine.cost += invoiceCost;
    profitLine.profit += rev - invoiceCost;
    profitTimelineMap.set(dateKey, profitLine);
  }

  // Format Payment Modes Array
  const paymentModes = Array.from(paymentModesMap.entries()).map(([mode, data]) => ({
    mode,
    amount: Math.round(data.amount * 100) / 100,
    count: data.count,
    percentage: totalRevenue > 0 ? Math.round((data.amount / totalRevenue) * 100) : 0,
  }));

  // Format GST Slabs Array
  const slabs = Array.from(slabMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([rate, data]) => ({
      rate,
      label: `GST ${rate}%`,
      taxableAmount: Math.round(data.taxableAmount * 100) / 100,
      cgst: Math.round((data.totalTax / 2) * 100) / 100,
      sgst: Math.round((data.totalTax / 2) * 100) / 100,
      totalTax: Math.round(data.totalTax * 100) / 100,
      totalAmount: Math.round(data.totalAmount * 100) / 100,
      itemCount: data.itemCount,
    }));

  // Format Products Array
  const allProducts = Array.from(productMap.values()).map((p) => ({
    ...p,
    revenue: Math.round(p.revenue * 100) / 100,
    quantitySold: Math.round(p.quantitySold * 100) / 100,
    averagePrice:
      p.quantitySold > 0 ? Math.round((p.revenue / p.quantitySold) * 100) / 100 : 0,
  }));

  allProducts.sort((a, b) => b.revenue - a.revenue);
  const topProducts = allProducts.slice(0, 50);

  // Category Breakdown
  const categoryMap = new Map<string, { revenue: number; quantitySold: number }>();
  allProducts.forEach((p) => {
    const cat = p.category || "General";
    const curr = categoryMap.get(cat) || { revenue: 0, quantitySold: 0 };
    curr.revenue += p.revenue;
    curr.quantitySold += p.quantitySold;
    categoryMap.set(cat, curr);
  });

  const categories = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    revenue: Math.round(data.revenue * 100) / 100,
    quantitySold: Math.round(data.quantitySold * 100) / 100,
  }));

  // Format Customers Array
  const allCustomers = Array.from(customerMap.values()).map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    gstNo: c.gstNo,
    invoicesCount: c.invoicesCount,
    totalSpent: Math.round(c.totalSpent * 100) / 100,
    totalPaid: Math.round(c.totalPaid * 100) / 100,
    balance: Math.round(c.balance * 100) / 100,
    lastVisit: format(c.lastVisit, "dd MMM yyyy"),
  }));
  allCustomers.sort((a, b) => b.totalSpent - a.totalSpent);

  const repeatCustomersCount = allCustomers.filter((c) => c.invoicesCount > 1).length;

  // Format Profit Data
  const grossProfit = totalRevenue - totalCost;
  const marginPercentage =
    totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;

  const dailyTimeline = Array.from(profitTimelineMap.values()).map((d) => ({
    date: d.date,
    label: d.label,
    revenue: Math.round(d.revenue * 100) / 100,
    cost: Math.round(d.cost * 100) / 100,
    profit: Math.round(d.profit * 100) / 100,
    margin: d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0,
  }));

  const productMargins = allProducts.map((p) => {
    const profit = p.revenue - p.totalCost;
    const margin = p.revenue > 0 ? Math.round((profit / p.revenue) * 1000) / 10 : 0;
    return {
      name: p.name,
      category: p.category,
      quantitySold: p.quantitySold,
      sellingPrice: p.averagePrice,
      costPrice: p.costPrice,
      revenue: p.revenue,
      totalCost: Math.round(p.totalCost * 100) / 100,
      grossProfit: Math.round(profit * 100) / 100,
      marginPercentage: margin,
      hasCost: p.hasCost,
    };
  });
  productMargins.sort((a, b) => b.grossProfit - a.grossProfit);

  const invoiceCount = invoices.length;
  const averageBillValue =
    invoiceCount > 0 ? Math.round((totalRevenue / invoiceCount) * 100) / 100 : 0;
  const averageCustomerSpend =
    allCustomers.length > 0
      ? Math.round((totalRevenue / allCustomers.length) * 100) / 100
      : 0;

  return {
    dateRange: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    sales: {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalBalance: Math.round(totalBalance * 100) / 100,
        invoiceCount,
        averageBillValue,
      },
      timeline: Array.from(timelineMap.values()),
      paymentModes,
      statusBreakdown: {
        paid: { count: paidStatusCount, amount: Math.round(paidStatusAmount * 100) / 100 },
        partial: { count: partialStatusCount, amount: Math.round(partialStatusAmount * 100) / 100 },
        unpaid: { count: unpaidStatusCount, amount: Math.round(unpaidStatusAmount * 100) / 100 },
      },
      invoicesList: invoicesList.reverse(),
    },
    gst: {
      summary: {
        totalTaxableAmount: Math.round(totalSubtotal * 100) / 100,
        totalTaxCollected: Math.round(totalTax * 100) / 100,
        cgst: Math.round((totalTax / 2) * 100) / 100,
        sgst: Math.round((totalTax / 2) * 100) / 100,
        b2bCount,
        b2bTotal: Math.round(b2bTotal * 100) / 100,
        b2bTax: Math.round(b2bTax * 100) / 100,
        b2cCount,
        b2cTotal: Math.round(b2cTotal * 100) / 100,
        b2cTax: Math.round(b2cTax * 100) / 100,
      },
      slabs,
      gstr1Register,
    },
    products: {
      summary: {
        totalItemsSold: allProducts.reduce((sum, p) => sum + p.quantitySold, 0),
        totalProductRevenue: Math.round(totalRevenue * 100) / 100,
        uniqueProductsCount: allProducts.length,
        topProductName: topProducts[0]?.name || "None",
      },
      topProducts,
      categories,
    },
    customers: {
      summary: {
        totalCustomers: allCustomers.length,
        repeatCustomers: repeatCustomersCount,
        averageSpend: averageCustomerSpend,
        topCustomerName: allCustomers[0]?.name || "None",
      },
      topCustomers: allCustomers.slice(0, 50),
    },
    profit: {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        marginPercentage,
        itemsWithCost,
        itemsWithoutCost,
      },
      dailyTimeline,
      productMargins: productMargins.slice(0, 50),
    },
  };
}
