"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PauseCircle,
  PlayCircle,
  Trash2,
  RefreshCw,
  Plus,
  Loader2,
  Calendar,
  User,
  ShoppingBag,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";

interface HeldBill {
  id: string;
  customerName?: string | null;
  customerMobile?: string | null;
  note?: string | null;
  payload: any;
  createdAt: string;
  updatedAt: string;
}

export default function HoldBillsPage() {
  const router = useRouter();
  const [bills, setBills] = useState<HeldBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchHeldBills() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/hold-bills");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load held bills");
      setBills(data.holdBills || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load held bills");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchHeldBills();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to discard this held bill?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/hold-bills/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      toast.success("Held bill discarded");
      setBills((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Could not discard bill");
    } finally {
      setDeletingId(null);
    }
  }

  function handleResume(id: string) {
    router.push(`/billing/new?resumeHoldId=${id}`);
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <PauseCircle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Held Bills (Parked Counter)</h1>
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                {bills.length} Active
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Paused customer orders ready to be resumed and completed at checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHeldBills}
            disabled={isLoading}
            className="text-xs h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/billing/new">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-9 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading held bills...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-center p-6">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
            <PauseCircle className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Held Bills</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            When a customer steps aside or waits during billing, click &ldquo;Hold Bill&rdquo; on the billing counter to park it here.
          </p>
          <Link href="/billing/new" className="mt-4">
            <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Go to POS Counter
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Held Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items / Details</th>
                  <th className="py-3 px-4 text-right">Est. Amount</th>
                  <th className="py-3 px-4">Note</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((bill) => {
                  const items = bill.payload?.items || [];
                  const itemCount = items.reduce((acc: number, it: any) => acc + (Number(it.qty) || 1), 0);
                  const estAmount = items.reduce((acc: number, it: any) => {
                    const q = Number(it.qty) || 0;
                    const p = Number(it.price) || 0;
                    const d = Number(it.itemDiscount) || 0;
                    const effectiveP = it.discountType === "percent" ? p * (1 - d / 100) : Math.max(0, p - d);
                    return acc + q * effectiveP;
                  }, 0);

                  const dateFormatted = new Date(bill.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const fullDate = new Date(bill.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  });

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{dateFormatted}</span>
                          <span className="text-[10px] text-slate-400">({fullDate})</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {bill.customerName || bill.payload?.customerName || "Walk-in Customer"}
                        </div>
                        {(bill.customerMobile || bill.payload?.customerMobile) && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {bill.customerMobile || bill.payload?.customerMobile}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <ShoppingBag className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{items.length} unique items ({itemCount} total pcs)</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">
                          {items.map((i: any) => i.name).filter(Boolean).slice(0, 3).join(", ")}
                          {items.length > 3 ? "..." : ""}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{estAmount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs">
                        {bill.note ? (
                          <Badge variant="outline" className="bg-slate-100 text-slate-700 text-[10px] font-normal">
                            {bill.note}
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleResume(bill.id)}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 shadow-sm"
                          >
                            <PlayCircle className="h-3.5 w-3.5" /> Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(bill.id)}
                            disabled={deletingId === bill.id}
                            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            {deletingId === bill.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
