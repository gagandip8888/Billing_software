"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  IndianRupee,
  FileText,
  Printer,
  RefreshCw,
  Loader2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PaymentReceivedDialog } from "@/components/udhari/PaymentReceivedDialog";

interface CustomerLedgerData {
  customer: {
    id: string;
    name: string;
    mobile: string;
    creditBalance: number;
    totalSpent: number;
    totalPaid: number;
  };
  ledger: Array<{
    id: string;
    date: string;
    type: "INVOICE" | "PAYMENT";
    title: string;
    reference?: string | null;
    debit: number;
    credit: number;
    paymentMode?: string;
    note?: string | null;
  }>;
}

export default function CustomerLedgerPage() {
  const params = useParams();
  const customerId = params?.customerId as string;
  const router = useRouter();

  const [data, setData] = useState<CustomerLedgerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  async function fetchLedger() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/udhari/${customerId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load customer ledger");
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Failed to load ledger");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchLedger();
    }
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading ledger statement...</p>
      </div>
    );
  }

  if (!data || !data.customer) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-600">Customer not found.</p>
        <Link href="/udhari">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Udhari List
          </Button>
        </Link>
      </div>
    );
  }

  const { customer, ledger } = data;

  // Calculate chronological running balance
  let runningBalance = 0;
  const ledgerWithRunningBalance = ledger.map((item) => {
    // Net addition to pending balance = debit (billed) - credit (paid)
    const net = item.debit - item.credit;
    runningBalance += net;
    return {
      ...item,
      runningBalance: Math.max(0, runningBalance),
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/udhari">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{customer.name}</h1>
              <Badge variant="outline" className="font-mono text-xs">
                {customer.mobile}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer Khata Account & Transaction History
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs h-9 gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Statement
          </Button>
          <Button
            size="sm"
            onClick={() => setIsPaymentOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 font-semibold gap-1.5 shadow-sm"
          >
            <IndianRupee className="h-3.5 w-3.5" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Pending Due (Udhari)</div>
          <div className="text-2xl font-black font-mono text-red-600 mt-1">
            ₹{customer.creditBalance.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {customer.creditBalance === 0 ? "Account cleared" : "Outstanding balance"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Lifetime Purchases</div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            ₹{customer.totalSpent.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total invoiced billing</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs text-slate-500 font-medium">Total Paid / Cleared</div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
            ₹{customer.totalPaid.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cash, UPI & receipts</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            Statement of Account
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            {ledger.length} {ledger.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {ledgerWithRunningBalance.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No transactions found for this customer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4">Ref / Mode</th>
                  <th className="py-3 px-4 text-right">Debit (₹)</th>
                  <th className="py-3 px-4 text-right">Credit (₹)</th>
                  <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {ledgerWithRunningBalance.map((row) => {
                  const dateStr = new Date(row.date).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const isBill = row.type === "INVOICE";

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-sans text-xs">
                        {dateStr}
                      </td>

                      <td className="py-3 px-4 font-sans text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isBill
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {isBill ? "BILL" : "RECEIPT"}
                          </span>
                          <span className="font-semibold text-slate-800">
                            {isBill && row.reference ? (
                              <Link
                                href={`/invoices/${row.id}`}
                                className="hover:text-blue-600 hover:underline"
                              >
                                {row.title}
                              </Link>
                            ) : (
                              row.title
                            )}
                          </span>
                        </div>
                        {row.note && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Note: {row.note}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-sans text-[11px]">
                        {row.reference || row.paymentMode || "—"}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {row.debit > 0 ? `₹${row.debit.toFixed(2)}` : "—"}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                        {row.credit > 0 ? `₹${row.credit.toFixed(2)}` : "—"}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-red-600 whitespace-nowrap">
                        ₹{row.runningBalance.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Received Modal */}
      <PaymentReceivedDialog
        open={isPaymentOpen}
        onOpenChange={setIsPaymentOpen}
        customer={customer}
        onPaymentRecorded={() => {
          fetchLedger();
        }}
      />
    </div>
  );
}
