import React, { Suspense } from "react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getTenantSubscription } from "@/lib/subscription";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import BillingLoading from "@/app/(dashboard)/billing/loading";

export const dynamic = "force-dynamic";

async function BillingContent() {
  const tenant = await requireTenant();

  const [tenantWithSettings, customers, products, subscription] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: { settings: true },
    }),
    prisma.customer.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.product.findMany({
      where: { tenantId: tenant.id, isActive: true },
      orderBy: { name: "asc" },
      take: 500,
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
    productId: p.productId,
    name: p.name,
    price: Number(p.price),
    taxRate: Number(p.taxRate),
    unit: p.unit,
    stockQty: p.stockQty !== null ? Number(p.stockQty) : null,
    category: p.category,
    size: p.size,
    color: p.color,
    brand: p.brand,
    mrp: p.mrp ? Number(p.mrp) : null,
    barcode: p.barcode,
    variantGroupId: p.variantGroupId,
  }));

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Clean Billing Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Billing Terminal
        </h1>
        <p className="text-xs text-slate-500">
          Fast counter POS billing, product lookup, and instant print receipt
        </p>
      </div>

      {/* Main Billing Form */}
      <InvoiceForm
        shopType={tenant.shopType}
        initialCustomers={serializedCustomers}
        initialProducts={serializedProducts}
        subscription={subscription}
        shopInfo={{
          shopName: tenantWithSettings?.businessName || tenant.businessName || "Store",
          upiId: tenantWithSettings?.settings?.upiId || "",
        }}
      />
    </div>
  );
}

export default function NewBillingPage() {
  return (
    <Suspense fallback={<BillingLoading />}>
      <BillingContent />
    </Suspense>
  );
}
