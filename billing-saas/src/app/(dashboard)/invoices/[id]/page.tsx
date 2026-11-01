import React, { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit3, Printer, Ticket, MessageCircle } from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { serializeInvoice } from "@/lib/invoice-utils";
import { InvoicePrint } from "@/components/invoices/InvoicePrint";
import { ShareButtons } from "@/components/invoices/ShareButtons";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@prisma/client";
import { DeleteInvoiceButton } from "@/components/invoices/DeleteInvoiceDialog";
import { InvoiceReturnAction } from "@/components/invoices/InvoiceReturnAction";

interface ViewInvoicePageProps {
  params: {
    id: string;
  };
  searchParams?: {
    print?: string;
  };
}

export const dynamic = "force-dynamic";

export default async function ViewInvoicePage({ params, searchParams }: ViewInvoicePageProps) {
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

  let openCreditNotesTotal = 0;
  if (invoice.customerId) {
    try {
      const openCns = await prisma.creditNote.findMany({
        where: {
          tenantId: tenant.id,
          status: "OPEN",
          invoice: { customerId: invoice.customerId },
        },
        select: { amount: true },
      });
      openCreditNotesTotal = openCns.reduce((sum, c) => sum + Number(c.amount), 0);
    } catch {
      // Safe fallback
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Open Credit Note Alert for Customer */}
      {openCreditNotesTotal > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-medium print:hidden">
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-purple-600" />
            <span>
              Customer has <strong className="font-bold">₹{openCreditNotesTotal.toFixed(2)}</strong> in available Store Credit Notes (vouchers).
            </span>
          </div>
          <Link href={`/billing/new?customerId=${invoice.customerId}`}>
            <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white">
              Redeem on New Bill
            </Button>
          </Link>
        </div>
      )}

      {/* WhatsApp Share Guidance Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs shadow-xs print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-bold text-emerald-900">
              Bill #{serialized.invoiceNo} generated successfully
            </p>
            <p className="text-emerald-700 text-[11px]">
              Customer: <strong>{customerName}</strong> {customerMobile ? `(${customerMobile})` : ""} &bull; Total: <strong>₹{Number(serialized.totalAmount).toFixed(2)}</strong>. Click <strong>Share to WhatsApp</strong> to send digital bill.
            </p>
          </div>
        </div>
      </div>

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

        <div className="flex items-center gap-2 flex-wrap">
          {serialized.status !== InvoiceStatus.CANCELLED && (
            <>
              <InvoiceReturnAction invoice={serialized} />
              <Link href={`/invoices/${serialized.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Bill
                </Button>
              </Link>
            </>
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
      <Suspense fallback={null}>
        <InvoicePrint
          invoice={serialized}
          tenant={invoice.tenant}
          autoPrint={searchParams?.print === "true"}
        />
      </Suspense>
    </div>
  );
}
