import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getTenantSubscription } from "@/lib/subscription";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { BillLimitBanner } from "@/components/subscription/BillLimitBanner";
import { Store, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewBillingPage() {
  const tenant = await requireTenant();

  const [customers, products, subscription] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    getTenantSubscription(tenant.id),
  ]);

  const serializedCustomers = customers.map((c) => ({
    id: c.id,
    name: c.name,
    mobile: c.mobile,
    email: c.email,
    address: c.address,
    gstNo: c.gstNo,
  }));

  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    taxRate: Number(p.taxRate),
    unit: p.unit,
    stockQty: p.stockQty !== null ? Number(p.stockQty) : null,
    category: p.category,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Terminal Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600 fill-blue-600" />
            Quick POS Billing Terminal
          </h1>
          <p className="text-xs text-slate-500">
            Fast counter billing for{" "}
            <span className="font-semibold text-slate-700">{tenant.businessName}</span>{" "}
            ({tenant.shopType.replace(/_/g, " ").toLowerCase()})
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-semibold border border-emerald-200 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            POS Ready
          </span>
        </div>
      </div>

      {/* Monthly Bill Limit Warning Banner */}
      <BillLimitBanner subscription={subscription} />

      {/* Main Billing Form */}
      <InvoiceForm
        shopType={tenant.shopType}
        initialCustomers={serializedCustomers}
        initialProducts={serializedProducts}
        subscription={subscription}
      />
    </div>
  );
}
