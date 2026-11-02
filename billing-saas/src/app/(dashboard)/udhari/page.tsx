"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Phone,
  Loader2,
  RefreshCw,
  FileText,
  Receipt,
  Eye,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UdhariCustomer {
  id: string;
  name: string;
  mobile: string;
  creditBalance: number;
  totalPaid: number;
}

interface UnpaidInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  status: string;
  customer?: {
    id?: string;
    name: string;
    mobile: string;
  } | null;
  metadata?: any;
}

export default function UdhariPage() {
  const [activeTab, setActiveTab] = useState<"bills" | "customers">("bills");
  const [customers, setCustomers] = useState<UdhariCustomer[]>([]);
  const [unpaidBills, setUnpaidBills] = useState<UnpaidInvoice[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settlingCustomer, setSettlingCustomer] = useState<UdhariCustomer | null>(null);
  const [isSettling, setIsSettling] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

  async function fetchUdhari() {
    setIsLoading(true);
    try {
      // 1. Fetch Udhari customers
      const resCust = await fetch("/api/udhari");
      const dataCust = await resCust.json();

      // 2. Fetch Unpaid bills
      const resBills = await fetch("/api/invoices?status=UNPAID&limit=100");
      const dataBills = await resBills.json();

      if (resCust.ok) {
        setCustomers(dataCust.customers || []);
        setTotalPending(dataCust.totalPending || 0);
      }

      if (resBills.ok && Array.isArray(dataBills.invoices)) {
        // Strictly filter to ensure only genuinely unpaid / partial bills with balance > 0
        const strictlyUnpaid = dataBills.invoices.filter((inv: any) => {
          const balance = Number(inv.balanceAmount || 0);
          return (
            balance > 0 &&
            inv.status !== "PAID" &&
            inv.status !== "CANCELLED"
          );
        });
        setUnpaidBills(strictlyUnpaid);

        // If totalPending was 0 from customers, compute from unpaid bills
        if (!dataCust.totalPending || dataCust.totalPending === 0) {
          const sum = strictlyUnpaid.reduce(
            (acc: number, inv: any) => acc + Number(inv.balanceAmount || 0),
            0
          );
          setTotalPending(sum);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load udhari records");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUdhari();
  }, []);

  async function handleSettleFull() {
    if (!settlingCustomer) return;
    setIsSettling(true);
    try {
      const res = await fetch(`/api/udhari/${settlingCustomer.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: settlingCustomer.creditBalance,
          paymentMode: "CASH",
          note: "Full Udhari settlement",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to settle udhari");

      toast.success(
        `Settled ₹${settlingCustomer.creditBalance.toLocaleString("en-IN")} for ${settlingCustomer.name}. Invoices marked as PAID!`
      );

      // Refresh list
      setSettlingCustomer(null);
      await fetchUdhari();
    } catch (err: any) {
      toast.error(err.message || "Could not settle udhari");
    } finally {
      setIsSettling(false);
    }
  }

  async function handleMarkBillPaid(bill: UnpaidInvoice) {
    if (markingPaidId) return;
    setMarkingPaidId(bill.id);
    try {
      const res = await fetch(`/api/invoices/${bill.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark invoice as paid");

      toast.success(`Bill #${bill.invoiceNo} marked as PAID!`);

      // Refresh data
      await fetchUdhari();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("billingsaas:bill-saved"));
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update bill");
    } finally {
      setMarkingPaidId(null);
    }
  }

  const filteredBills = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return unpaidBills;
    return unpaidBills.filter((b) => {
      const custName = b.customer?.name || b.metadata?.walkInCustomerName || "";
      const custMobile = b.customer?.mobile || b.metadata?.walkInCustomerMobile || "";
      return (
        b.invoiceNo.toLowerCase().includes(q) ||
        custName.toLowerCase().includes(q) ||
        custMobile.includes(q)
      );
    });
  }, [unpaidBills, searchQuery]);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header: Udhari (Credit) & Total Pending */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-red-600" />
            Udhari (Credit / Dues)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict list of unpaid bills and customer credit balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-red-700 font-medium">Total Balance Due:</span>
            <span className="text-base font-black text-red-700 font-mono">
              ₹{totalPending.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchUdhari}
            disabled={isLoading}
            className="h-9 text-xs gap-1 border-slate-200"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Toggle */}
        <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-100 max-w-xs">
          <button
            type="button"
            onClick={() => setActiveTab("bills")}
            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "bills"
                ? "bg-white text-red-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            Unpaid Bills ({unpaidBills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("customers")}
            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "customers"
                ? "bg-white text-red-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Phone className="h-3.5 w-3.5" />
            Customer Khata ({customers.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={
              activeTab === "bills"
                ? "Search by Bill #, customer name or mobile..."
                : "Search by customer name or mobile..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-white border-slate-200"
          />
        </div>
      </div>

      {/* TAB 1: UNPAID BILLS TABLE (STRICTLY UNPAID INVOICES) */}
      {activeTab === "bills" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              <span>Loading unpaid bills...</span>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 stroke-1" />
              <span className="text-sm font-semibold text-slate-700">No Unpaid Bills!</span>
              <span>All customer bills have been marked as PAID.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Bill No</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Total Amount</th>
                    <th className="py-3 px-4">Balance Due</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBills.map((b) => {
                    const custName =
                      b.customer?.name ||
                      b.metadata?.walkInCustomerName ||
                      "Walk-in Customer";
                    const custMobile =
                      b.customer?.mobile ||
                      b.metadata?.walkInCustomerMobile ||
                      "";
                    const dateFormatted = new Date(b.invoiceDate).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" }
                    );

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600">
                          <Link href={`/invoices/${b.id}`} className="hover:underline">
                            {b.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{dateFormatted}</td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{custName}</div>
                          {custMobile && (
                            <div className="text-[11px] text-slate-500 font-mono">
                              {custMobile}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700 font-medium">
                          ₹{Number(b.totalAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-red-600">
                          ₹{Number(b.balanceAmount).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] font-bold bg-red-50 text-red-700 border-red-200 uppercase tracking-tight"
                          >
                            BALANCE DUE
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/invoices/${b.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 gap-1"
                              >
                                <Eye className="h-3 w-3" /> View
                              </Button>
                            </Link>

                            <Button
                              size="sm"
                              disabled={markingPaidId === b.id}
                              onClick={() => handleMarkBillPaid(b)}
                              className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs gap-1"
                            >
                              {markingPaidId === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                              Mark Paid
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOMER KHATA TABLE */}
      {activeTab === "customers" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-red-600" />
              <span>Loading customer khata accounts...</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 stroke-1" />
              <span className="text-sm font-semibold text-slate-700">No pending Udhari!</span>
              <span>All customer khata accounts are settled.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Mobile</th>
                    <th className="py-3 px-4">Total Pending (₹)</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {c.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        {c.mobile || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-red-600 font-mono text-sm">
                          ₹{c.creditBalance.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setSettlingCustomer(c)}
                          className="h-7 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                        >
                          Settle Full
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Settle Confirmation Modal */}
      <AlertDialog
        open={Boolean(settlingCustomer)}
        onOpenChange={(open) => !open && setSettlingCustomer(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Settle Udhari for {settlingCustomer?.name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 space-y-2">
              <p>
                Mark full pending balance of{" "}
                <strong className="text-red-600 font-mono">
                  ₹{settlingCustomer?.creditBalance.toLocaleString("en-IN")}
                </strong>{" "}
                as paid in cash?
              </p>
              <p className="text-[11px] text-slate-400">
                This will reduce the customer&apos;s Udhari balance to ₹0 and update all unpaid bills to PAID.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSettling} className="text-xs h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSettling}
              onClick={handleSettleFull}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {isSettling ? "Settling..." : "Confirm & Mark Paid"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
