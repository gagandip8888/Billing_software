import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getTenantSubscription } from "@/lib/subscription";
import { startOfDay, startOfMonth, subDays } from "date-fns";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const tenant = await requireTenant();
  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  // Parallel queries for performance
  const [
    todayInvoices,
    monthInvoices,
    totalInvoices,
    activeCustomers,
    lowStockProducts,
    recentInvoices,
    topProducts,
    subscription,
  ] = await Promise.all([
    // Today's invoices
    prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        invoiceDate: { gte: todayStart },
        status: { not: "CANCELLED" },
      },
      select: { totalAmount: true, status: true },
    }),

    // This month's invoices
    prisma.invoice.findMany({
      where: {
        tenantId: tenant.id,
        invoiceDate: { gte: monthStart },
        status: { not: "CANCELLED" },
      },
      select: { totalAmount: true, paidAmount: true, status: true },
    }),

    // Total invoice count
    prisma.invoice.count({
      where: { tenantId: tenant.id, status: { not: "CANCELLED" } },
    }),

    // Active customers
    prisma.customer.count({
      where: { tenantId: tenant.id, isActive: true },
    }),

    // Low stock products
    prisma.product.findMany({
      where: {
        tenantId: tenant.id,
        isActive: true,
        stockQty: { not: null },
        lowStockAlert: { not: null },
      },
      select: { id: true, name: true, stockQty: true, lowStockAlert: true },
    }),

    // Recent 5 invoices
    prisma.invoice.findMany({
      where: { tenantId: tenant.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { customer: { select: { name: true, mobile: true } } },
    }),

    // Top 5 products by sale count (last 30 days)
    prisma.invoiceItem.groupBy({
      by: ["productId", "name"],
      where: {
        invoice: {
          tenantId: tenant.id,
          invoiceDate: { gte: subDays(now, 30) },
          status: { not: "CANCELLED" },
        },
      },
      _sum: { qty: true, total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    }),

    // Subscription status & limits
    getTenantSubscription(tenant.id),
  ]);

  // Calculate real KPIs
  const todaySales = todayInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0
  );
  const todayInvoiceCount = todayInvoices.length;
  const monthRevenue = monthInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0
  );
  const pendingDues = monthInvoices
    .filter((inv) => inv.status !== "PAID")
    .reduce((sum, inv) => sum + (Number(inv.totalAmount) - Number(inv.paidAmount)), 0);
  const paidAmount = monthInvoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  // Low stock = where stockQty <= lowStockAlert
  const lowStockItems = lowStockProducts.filter(
    (p) => Number(p.stockQty) <= Number(p.lowStockAlert)
  );

  // Yesterday's sales for comparison
  const yesterdayStart = startOfDay(subDays(now, 1));
  const yesterdayInvoices = await prisma.invoice.findMany({
    where: {
      tenantId: tenant.id,
      invoiceDate: { gte: yesterdayStart, lt: todayStart },
      status: { not: "CANCELLED" },
    },
    select: { totalAmount: true },
  });
  const yesterdaySales = yesterdayInvoices.reduce(
    (sum, inv) => sum + Number(inv.totalAmount),
    0
  );
  const salesChange =
    yesterdaySales > 0
      ? (((todaySales - yesterdaySales) / yesterdaySales) * 100).toFixed(1)
      : "0";

  // Pass all data to client component
  return (
    <DashboardClient
      tenant={{
        id: tenant.id,
        businessName: tenant.businessName,
        shopType: tenant.shopType,
        ownerName: tenant.ownerName,
        mobile: tenant.mobile,
      }}
      subscription={{
        plan: subscription.plan,
        status: subscription.status,
        billsThisMonth: subscription.usage.billsThisMonth,
        billLimit: subscription.usage.billLimit,
        remainingBills: subscription.usage.remainingBills,
        percentageUsed: subscription.usage.percentageUsed,
      }}
      todaySales={todaySales}
      todayInvoiceCount={todayInvoiceCount}
      yesterdaySales={yesterdaySales}
      salesChange={salesChange}
      monthRevenue={monthRevenue}
      pendingDues={pendingDues}
      paidAmount={paidAmount}
      totalInvoices={totalInvoices}
      activeCustomers={activeCustomers}
      lowStockCount={lowStockItems.length}
      lowStockItems={lowStockItems.map((p) => ({
        id: p.id,
        name: p.name,
        stockQty: p.stockQty ? Number(p.stockQty) : 0,
        lowStockAlert: p.lowStockAlert ? Number(p.lowStockAlert) : 0,
      }))}
      recentInvoices={recentInvoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate.toISOString(),
        totalAmount: inv.totalAmount.toString(),
        status: inv.status,
        paymentMode: inv.paymentMode,
        customerName: inv.customer?.name || "Walk-in",
      }))}
      topProducts={topProducts.map((p) => ({
        name: p.name,
        qty: p._sum.qty?.toString() || "0",
        revenue: p._sum.total?.toString() || "0",
      }))}
    />
  );
}
