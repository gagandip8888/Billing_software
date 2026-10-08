import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const tenant = await requireTenant();

  // Fetch initial customers and products directly on server
  const [customers, products] = await Promise.all([
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices">
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 text-slate-600 hover:text-slate-900 border-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Create Tax Invoice
          </h1>
          <p className="text-xs text-slate-500">
            Generate bill for customer with automatic GST and shop-specific attributes
          </p>
        </div>
      </div>

      <InvoiceForm
        shopType={tenant.shopType}
        initialCustomers={serializedCustomers}
        initialProducts={serializedProducts}
      />
    </div>
  );
}
