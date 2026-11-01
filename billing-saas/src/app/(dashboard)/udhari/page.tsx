"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  IndianRupee,
  Search,
  CheckCircle2,
  Phone,
  Loader2,
  AlertCircle,
  RefreshCw,
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

export default function UdhariPage() {
  const [customers, setCustomers] = useState<UdhariCustomer[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [settlingCustomer, setSettlingCustomer] = useState<UdhariCustomer | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  async function fetchUdhari() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/udhari");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load udhari list");
      setCustomers(data.customers || []);
      setTotalPending(data.totalPending || 0);
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
      setCustomers((prev) => prev.filter((c) => c.id !== settlingCustomer.id));
      setTotalPending((prev) => Math.max(0, prev - settlingCustomer.creditBalance));
      setSettlingCustomer(null);
    } catch (err: any) {
      toast.error(err.message || "Could not settle udhari");
    } finally {
      setIsSettling(false);
    }
  }

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
      {/* Header ONLY: Udhari (Credit) & Total Pending */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <IndianRupee className="h-6 w-6 text-red-600" />
            Udhari (Credit)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Customer khata balances and 1-click settlement
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-xs text-red-700 font-medium">Total Pending:</span>
            <span className="text-base font-black text-red-700 font-mono">
              ₹{totalPending.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <Input
          type="text"
          placeholder="Search by customer name or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 text-xs bg-white border-slate-200"
        />
      </div>

      {/* Udhari Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
            <span>Loading Udhari ledger...</span>
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
                        Settle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
