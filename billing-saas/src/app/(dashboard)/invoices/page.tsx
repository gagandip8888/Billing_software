import Link from "next/link";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { serializeInvoice } from "@/lib/invoice-utils";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Plus,
  TrendingUp,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { InvoiceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const tenant = await requireTenant();

  // Fetch all invoices for tenant to calculate metrics
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: tenant.id,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
        },
      },
      items: true,
    },
    orderBy: {
      invoiceDate: "desc",
    },
    take: 100,
  });

  const serializedInvoices = invoices.map(serializeInvoice);

  // Compute live revenue metrics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let todaySales = 0;
  let monthSales = 0;
  let unpaidTotal = 0;
  let paidCount = 0;

  invoices.forEach((inv) => {
    if (inv.status !== InvoiceStatus.CANCELLED) {
      const amt = Number(inv.totalAmount);
      const invDate = new Date(inv.invoiceDate);

      if (invDate >= startOfToday) {
        todaySales += amt;
      }
      if (invDate >= startOfMonth) {
        monthSales += amt;
      }
      if (Number(inv.balanceAmount) > 0) {
        unpaidTotal += Number(inv.balanceAmount);
      }
      if (inv.status === InvoiceStatus.PAID) {
        paidCount++;
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoices & Billing History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track generated bills, GST slabs, customer payments, and pending dues for{" "}
            <span className="font-semibold text-slate-700">{tenant.businessName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/billing/new">
            <Button className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Create New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              ₹{todaySales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500">Today&apos;s Sales</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              ₹{monthSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500">This Month&apos;s Revenue</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-red-600">
              ₹{unpaidTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500">Pending Dues (Khata)</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{invoices.length}</div>
            <div className="text-xs text-slate-500">Total Invoices</div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <InvoiceTable
        initialInvoices={serializedInvoices}
        businessName={tenant.businessName}
      />
    </div>
  );
}
