import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Printer } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { serializeInvoice } from "@/lib/invoice-utils";
import { InvoicePrint } from "@/components/invoices/InvoicePrint";
import { ShareButtons } from "@/components/invoices/ShareButtons";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@prisma/client";
import { DeleteInvoiceButton } from "@/components/invoices/DeleteInvoiceDialog";

interface ViewInvoicePageProps {
  params: {
    id: string;
  };
}

export const dynamic = "force-dynamic";

export default async function ViewInvoicePage({ params }: ViewInvoicePageProps) {
  const tenant = await requireTenant();
  const { id } = params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: tenant.id,
    },
    include: {
      customer: true,
      items: true,
      tenant: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const serialized = serializeInvoice(invoice);
  const customerName =
    invoice.customer?.name ||
    (invoice.metadata as any)?.walkInCustomerName ||
    "Customer";
  const customerMobile =
    invoice.customer?.mobile ||
    (invoice.metadata as any)?.walkInCustomerMobile ||
    "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Action Bar (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
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
              Invoice #{serialized.invoiceNo}
            </h1>
            <p className="text-xs text-slate-500">
              Generated for <span className="font-semibold text-slate-700">{customerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {serialized.status !== InvoiceStatus.CANCELLED && (
            <Link href={`/invoices/${serialized.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Edit3 className="h-3.5 w-3.5" /> Edit Bill
              </Button>
            </Link>
          )}

          <ShareButtons
            invoiceId={serialized.id}
            invoiceNo={serialized.invoiceNo}
            totalAmount={serialized.totalAmount}
            businessName={tenant.businessName}
            customerName={customerName}
            customerMobile={customerMobile}
          />

          <DeleteInvoiceButton
            invoiceId={serialized.id}
            invoiceNo={serialized.invoiceNo}
            redirectOnSuccess={true}
          />
        </div>
      </div>

      {/* Invoice Document / Printable UI */}
      <InvoicePrint invoice={serialized} tenant={invoice.tenant} />
    </div>
  );
}
