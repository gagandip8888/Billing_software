import React, { Suspense } from "react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { serializeInvoice } from "@/lib/invoice-utils";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import { TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { InvoiceStatus } from "@prisma/client";
import InvoicesLoading from "./loading";

export const dynamic = "force-dynamic";

async function InvoicesContent() {
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

  // Compute live metrics: Total Unpaid, Total Paid, Today's Sales
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let todaySales = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;

  invoices.forEach((inv) => {
    if (inv.status !== InvoiceStatus.CANCELLED) {
      const amt = Number(inv.totalAmount);
      const paid = Number(inv.paidAmount);
      const balance = Number(inv.balanceAmount);
      const invDate = new Date(inv.invoiceDate);

      if (invDate >= startOfToday) {
        todaySales += amt;
      }
      totalPaid += paid;
      if (balance > 0 || inv.status === InvoiceStatus.UNPAID) {
        totalUnpaid += balance;
      }
    }
  });

  // Subtract today's returns from today's sales
  try {
    const todayReturns = await prisma.salesReturn.findMany({
      where: {
        tenantId: tenant.id,
        returnDate: { gte: startOfToday },
      },
      select: { totalAmount: true },
    });
    const todayReturnsTotal = todayReturns.reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
    todaySales = Math.max(0, todaySales - todayReturnsTotal);
  } catch (retErr) {
    console.warn("Could not fetch todayReturns for invoices page:", retErr);
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION - NO "Create New Bill" Button */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Invoices
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track customer bills, record payments, and mark dues as settled for{" "}
          <span className="font-semibold text-slate-700">{tenant.businessName}</span>
        </p>
      </div>

      {/* 3 STATS CARDS: Total Unpaid, Total Paid, Today's Sales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Unpaid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-red-600 font-mono">
              ₹{totalUnpaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Unpaid (Dues)</div>
          </div>
        </div>

        {/* Total Paid */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-emerald-600 font-mono">
              ₹{totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 font-medium">Total Paid (Collected)</div>
          </div>
        </div>

        {/* Today's Sales */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              ₹{todaySales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 font-medium">Today&apos;s Sales</div>
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

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesLoading />}>
      <InvoicesContent />
    </Suspense>
  );
}
