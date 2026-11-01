"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Ticket,
  Search,
  RefreshCw,
  Plus,
  Loader2,
  Calendar,
  User,
  ArrowRight,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CreditNoteRecord {
  id: string;
  creditNoteNo: string;
  amount: number;
  reason: string;
  status: "OPEN" | "USED" | "EXPIRED";
  usedInInvoiceId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  invoice?: {
    id: string;
    invoiceNo: string;
    customer?: {
      id: string;
      name: string;
      mobile: string;
    } | null;
  } | null;
}

export default function CreditNotesPage() {
  const router = useRouter();
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function fetchCreditNotes() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/credit-notes");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load credit notes");
      setCreditNotes(data.creditNotes || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch credit notes");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchCreditNotes();
  }, []);

  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      const matchesStatus = statusFilter === "ALL" || cn.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        cn.creditNoteNo.toLowerCase().includes(q) ||
        (cn.invoice?.invoiceNo && cn.invoice.invoiceNo.toLowerCase().includes(q)) ||
        (cn.invoice?.customer?.name && cn.invoice.customer.name.toLowerCase().includes(q)) ||
        (cn.reason && cn.reason.toLowerCase().includes(q));

      return matchesStatus && matchesQuery;
    });
  }, [creditNotes, searchQuery, statusFilter]);

  const openVoucherTotal = useMemo(() => {
    return creditNotes
      .filter((cn) => cn.status === "OPEN")
      .reduce((acc, cn) => acc + cn.amount, 0);
  }, [creditNotes]);

  function handleApplyToBill(cn: CreditNoteRecord) {
    if (cn.status !== "OPEN") {
      toast.info(`This credit note is already ${cn.status.toLowerCase()}`);
      return;
    }
    const customerId = cn.invoice?.customer?.id;
    if (customerId) {
      router.push(`/billing/new?customerId=${customerId}&creditNoteId=${cn.id}`);
    } else {
      router.push(`/billing/new?creditNoteId=${cn.id}`);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Credit Notes & Store Vouchers</h1>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-mono font-bold">
                Open Credit: ₹{openVoucherTotal.toFixed(2)}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer exchange credit balances redeemable on future bills.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCreditNotes}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Note No, Customer, or Bill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="OPEN">Open (Active)</SelectItem>
              <SelectItem value="USED">Used / Redeemed</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
          Showing {filteredCreditNotes.length} credit {filteredCreditNotes.length === 1 ? "note" : "notes"}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-600">Loading credit notes...</p>
        </div>
      ) : filteredCreditNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-center p-6">
          <div className="h-12 w-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mb-3">
            <Ticket className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Credit Notes</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            When customer returns or exchanges items with store credit, a Credit Note voucher is generated here automatically.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Credit Note No</th>
                  <th className="py-3 px-4">Date Issued</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Orig. Invoice</th>
                  <th className="py-3 px-4 text-right">Credit Value</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCreditNotes.map((cn) => {
                  const dateStr = new Date(cn.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const expiryStr = cn.expiresAt
                    ? new Date(cn.expiresAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "No Expiry";

                  return (
                    <tr key={cn.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {cn.creditNoteNo}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {cn.invoice?.customer?.name || "Walk-in Customer"}
                        </div>
                        {cn.invoice?.customer?.mobile && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {cn.invoice.customer.mobile}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {cn.invoice ? (
                          <Link
                            href={`/invoices/${cn.invoice.id}`}
                            className="font-mono text-blue-600 hover:underline font-semibold"
                          >
                            #{cn.invoice.invoiceNo}
                          </Link>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        ₹{cn.amount.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cn.status === "OPEN"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : cn.status === "USED"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {cn.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {expiryStr}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {cn.status === "OPEN" ? (
                          <Button
                            size="sm"
                            onClick={() => handleApplyToBill(cn)}
                            className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold gap-1.5 shadow-sm"
                          >
                            <Ticket className="h-3.5 w-3.5" /> Apply to Invoice
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400">Redeemed</span>
                        )}
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
