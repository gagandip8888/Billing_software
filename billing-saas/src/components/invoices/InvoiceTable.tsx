"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Search,
  Plus,
  Eye,
  Printer,
  MoreVertical,
  Ban,
  Calendar,
  FileSpreadsheet,
  IndianRupee,
  MessageCircle,
  ExternalLink,
  Trash2,
  WifiOff,
  RefreshCw,
  RotateCcw,
  X,
  Filter,
  Edit3,
} from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { InvoiceStatus } from "@prisma/client";

export interface SerializedInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  status: InvoiceStatus;
  notes?: string | null;
  metadata?: any;
  customer?: {
    id: string;
    name: string;
    mobile: string;
    email?: string | null;
  } | null;
  items?: any[];
  hasReturn?: boolean;
  salesReturns?: Array<{ id: string; returnNo: string; totalAmount?: number }>;
}

interface InvoiceTableProps {
  initialInvoices: SerializedInvoice[];
  businessName: string;
  userRole?: string;
}

export function InvoiceTable({
  initialInvoices,
  businessName,
  userRole = "OWNER",
}: InvoiceTableProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isCashier = userRole === "CASHIER" || (session?.user as any)?.role === "CASHIER";
  const [invoices, setInvoices] = useState<SerializedInvoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [datePreset, setDatePreset] = useState<string>("ALL");
  const [cancellingInvoice, setCancellingInvoice] =
    useState<SerializedInvoice | null>(null);
  const [cancelPassword, setCancelPassword] = useState("");
  const [deletingInvoice, setDeletingInvoice] =
    useState<SerializedInvoice | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const { pendingCount, isSyncing, syncNow, isOnline } = useOfflineSync();

  function applyDatePreset(preset: string) {
    const now = new Date();
    setDatePreset(preset);
    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "TODAY") {
      const todayStr = format(now, "yyyy-MM-dd");
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "YESTERDAY") {
      const yestStr = format(subDays(now, 1), "yyyy-MM-dd");
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === "LAST_7_DAYS") {
      setStartDate(format(subDays(now, 6), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    } else if (preset === "THIS_MONTH") {
      setStartDate(format(startOfMonth(now), "yyyy-MM-dd"));
      setEndDate(format(now, "yyyy-MM-dd"));
    }
  }

  function handleResetFilters() {
    setSearchQuery("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    setDatePreset("ALL");
  }

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "ALL" ||
    Boolean(startDate) ||
    Boolean(endDate);

  function getWhatsAppShareLink(inv: SerializedInvoice) {
    const customerName =
      inv.customer?.name ||
      inv.metadata?.walkInCustomerName ||
      "Customer";
    const rawMobile =
      inv.customer?.mobile ||
      inv.metadata?.walkInCustomerMobile ||
      "";
    const digits = rawMobile.replace(/\D/g, "");
    const cleanMobile = digits.length >= 10 ? `91${digits.slice(-10)}` : "";

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const invoiceUrl = `${origin}/invoices/${inv.id}`;

    const whatsappMessage = `Hi ${customerName}, here is your bill #${inv.invoiceNo} of ₹${Number(
      inv.totalAmount
    ).toFixed(2)} from ${businessName}.\n\nView / Download Bill: ${invoiceUrl}\n\nThank you for your business!`;

    return cleanMobile
      ? `https://wa.me/${cleanMobile}?text=${encodeURIComponent(whatsappMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;
  }

  function handleShareWhatsApp(inv: SerializedInvoice) {
    const url = getWhatsAppShareLink(inv);
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success(`Opening WhatsApp for bill #${inv.invoiceNo}...`);
  }

  async function handleMarkAsPaid(inv: SerializedInvoice) {
    setMarkingPaidId(inv.id);
    try {
      const res = await fetch(`/api/invoices/${inv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: InvoiceStatus.PAID }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to mark invoice as paid");
      }
      toast.success(`Invoice #${inv.invoiceNo} marked as PAID`);
      setInvoices((prev) =>
        prev.map((item) =>
          item.id === inv.id
            ? {
                ...item,
                status: InvoiceStatus.PAID,
                paidAmount: item.totalAmount,
                balanceAmount: 0,
              }
            : item
        )
      );
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not mark as paid");
    } finally {
      setMarkingPaidId(null);
    }
  }

  // Sync state if server data refreshes
  React.useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  // Real-time synchronization across owner and employee devices/tabs
  React.useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("billingsaas_live_updates");
      channel.onmessage = (msg) => {
        if (
          msg.data?.type === "BILL_CREATED" ||
          msg.data?.type === "BILL_DELETED" ||
          msg.data?.type === "SETTINGS_UPDATED"
        ) {
          router.refresh();
        }
      };
    } catch {}

    const handleCustomBillSaved = () => {
      router.refresh();
    };
    window.addEventListener("billingsaas:bill-saved", handleCustomBillSaved);
    window.addEventListener("billingsaas:sync-complete", handleCustomBillSaved);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "billingsaas:last_bill_time") {
        router.refresh();
      }
    };
    window.addEventListener("storage", handleStorage);

    // Optimized 5-second polling so both employee and owner see new bills in real-time
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("billingsaas:bill-saved", handleCustomBillSaved);
      window.removeEventListener("billingsaas:sync-complete", handleCustomBillSaved);
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  // Client-side filtering
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNo = inv.invoiceNo.toLowerCase().includes(q);
        const matchesCust =
          (inv.customer?.name || "").toLowerCase().includes(q) ||
          (inv.customer?.mobile || "").toLowerCase().includes(q) ||
          (inv.metadata?.walkInCustomerName || "").toLowerCase().includes(q) ||
          (inv.metadata?.walkInCustomerMobile || "").toLowerCase().includes(q);
        const matchesNotes = (inv.notes || "").toLowerCase().includes(q);

        if (!matchesNo && !matchesCust && !matchesNotes) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      // Date Range Filtering
      if (startDate) {
        const invDate = new Date(inv.invoiceDate);
        const start = new Date(`${startDate}T00:00:00`);
        if (invDate < start) return false;
      }

      if (endDate) {
        const invDate = new Date(inv.invoiceDate);
        const end = new Date(`${endDate}T23:59:59`);
        if (invDate > end) return false;
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter, startDate, endDate]);

  const filteredTotalAmount = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  }, [filteredInvoices]);

  const filteredBalanceAmount = useMemo(() => {
    return filteredInvoices.reduce((sum, inv) => sum + Number(inv.balanceAmount || 0), 0);
  }, [filteredInvoices]);

  async function handleCancelInvoice(invoice: SerializedInvoice) {
    if (isCashier && !cancelPassword.trim()) {
      toast.error("Please enter the Store Owner Password to authorize cancellation.");
      return;
    }

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-delete-password": cancelPassword.trim(),
        },
        body: JSON.stringify({ password: cancelPassword.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to cancel invoice");
      }

      toast.success(`Invoice #${invoice.invoiceNo} has been cancelled`);
      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoice.id ? { ...i, status: InvoiceStatus.CANCELLED } : i
        )
      );
      setCancelPassword("");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsCancelling(false);
      setCancellingInvoice(null);
    }
  }

  function getStatusBadge(status: InvoiceStatus) {
    switch (status) {
      case InvoiceStatus.PAID:
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
            PAID
          </Badge>
        );
      case InvoiceStatus.PARTIAL:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-semibold">
            PARTIAL
          </Badge>
        );
      case InvoiceStatus.UNPAID:
        return (
          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold">
            UNPAID
          </Badge>
        );
      case InvoiceStatus.CANCELLED:
        return (
          <Badge variant="secondary" className="text-[10px] font-semibold text-slate-500">
            CANCELLED
          </Badge>
        );
      case InvoiceStatus.DRAFT:
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-semibold text-slate-600">
            DRAFT
          </Badge>
        );
    }
  }

  return (
    <div className="space-y-4">
      {/* OFFLINE PENDING BILLS NOTIFICATION */}
      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <WifiOff className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <p className="font-bold text-amber-900">
                {pendingCount} offline {pendingCount === 1 ? "bill" : "bills"} pending sync
              </p>
              <p className="text-[11px] text-amber-700">
                Created offline on this browser. Automatically uploads to server once connection is stable.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={syncNow}
            disabled={isSyncing || !isOnline}
            className="h-8 border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold gap-1.5 shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : isOnline ? "Sync Now" : "Waiting for Network"}
          </Button>
        </div>
      )}

      {/* ADVANCED FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
        {/* Top Controls: Search, Status, New Bill */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search bill #, customer name, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Invoices</SelectItem>
                  <SelectItem value={InvoiceStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={InvoiceStatus.PARTIAL}>Partial</SelectItem>
                  <SelectItem value={InvoiceStatus.UNPAID}>Unpaid / Khata</SelectItem>
                  <SelectItem value={InvoiceStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Link href="/billing/new" prefetch={true}>
              <Button className="h-9 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> + New Bill
              </Button>
            </Link>
          </div>
        </div>

        {/* Date Range Filters & Quick Presets */}
        <div className="pt-2 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Quick Date Presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Dates:
            </span>
            <button
              type="button"
              onClick={() => applyDatePreset("ALL")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "ALL" && !startDate && !endDate
                  ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset("TODAY")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "TODAY"
                  ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset("YESTERDAY")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "YESTERDAY"
                  ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset("LAST_7_DAYS")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "LAST_7_DAYS"
                  ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset("THIS_MONTH")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                datePreset === "THIS_MONTH"
                  ? "bg-purple-100 text-purple-800 border border-purple-300 font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              This Month
            </button>
          </div>

          {/* Date Picker Inputs (From & To) + Clear Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset("CUSTOM");
                }}
                className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none cursor-pointer"
              />
            </div>

            {isFiltered && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetFilters}
                className="h-7 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 px-2 font-semibold gap-1"
              >
                <X className="h-3.5 w-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Live Filter Summary Bar */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              Showing {filteredInvoices.length} of {invoices.length} {filteredInvoices.length === 1 ? "bill" : "bills"}
            </span>
            {isFiltered && (
              <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200 font-bold">
                Filtered View
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3 font-mono font-bold text-xs">
            <span className="text-slate-700">
              Filtered Total: <strong className="text-slate-900">₹{filteredTotalAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong>
            </span>
            {filteredBalanceAmount > 0 && (
              <span className="text-rose-600">
                Due: ₹{filteredBalanceAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/75 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[140px] text-xs font-bold text-slate-700">
                Invoice No
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Date</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Customer</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Amount</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
              <TableHead className="text-xs font-bold text-slate-700">Mode</TableHead>
              <TableHead className="w-[80px] text-right text-xs font-bold text-slate-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-64 text-center py-12">
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {invoices.length === 0
                        ? "No invoices recorded yet"
                        : "No matching invoices found"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {invoices.length === 0
                        ? "Generate your first bill with automatic GST calculation, thermal/A4 print, and WhatsApp sharing."
                        : "Try adjusting your search query or status filter."}
                    </p>
                    {invoices.length === 0 && (
                      <Link href="/billing/new">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                        >
                          <Plus className="mr-1.5 h-3.5 w-3.5" /> Create First Bill
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((inv) => {
                const customerName =
                  inv.customer?.name ||
                  inv.metadata?.walkInCustomerName ||
                  "Cash / Walk-in";
                const customerMobile =
                  inv.customer?.mobile || inv.metadata?.walkInCustomerMobile || "";

                const dateStr = new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <TableRow
                    key={inv.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Invoice No */}
                    <TableCell className="font-mono font-bold text-xs text-blue-600">
                      <div className="flex flex-col gap-1 items-start">
                        <Link
                          href={`/invoices/${inv.id}`}
                          prefetch={true}
                          className="hover:underline flex items-center gap-1"
                        >
                          {inv.invoiceNo}
                        </Link>
                        {(inv.hasReturn || (inv.salesReturns && inv.salesReturns.length > 0)) && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 font-bold bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1 tracking-tight"
                            title="Sales return recorded for this bill"
                          >
                            <RotateCcw className="h-2.5 w-2.5 text-amber-600" />
                            RETURNED
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-slate-600">
                      {dateStr}
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                      <div className="text-xs font-semibold text-slate-900">
                        {customerName}
                      </div>
                      {customerMobile && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          {customerMobile}
                        </div>
                      )}
                    </TableCell>

                    {/* Amount */}
                    <TableCell>
                      <div className="text-xs font-bold text-slate-900 font-mono">
                        ₹{Number(inv.totalAmount).toFixed(2)}
                      </div>
                      {Number(inv.balanceAmount) > 0 && (
                        <div className="text-[10px] text-red-600 font-semibold">
                          Due: ₹{Number(inv.balanceAmount).toFixed(2)}
                        </div>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>

                    {/* Mode */}
                    <TableCell>
                      <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded uppercase">
                        {inv.paymentMode}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Direct WhatsApp Share Action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareWhatsApp(inv)}
                          title="Share bill on WhatsApp"
                          className="h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-600 hover:text-white border-emerald-200 transition flex items-center gap-1 shrink-0"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">WhatsApp</span>
                        </Button>

                        {inv.status !== InvoiceStatus.PAID &&
                          inv.status !== InvoiceStatus.CANCELLED && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={markingPaidId === inv.id}
                              onClick={() => handleMarkAsPaid(inv)}
                              className="h-7 px-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                            >
                              {markingPaidId === inv.id ? "Saving..." : "Mark Paid"}
                            </Button>
                          )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem asChild className="text-xs cursor-pointer">
                            <Link href={`/invoices/${inv.id}`} prefetch={true}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              View Bill
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => handleShareWhatsApp(inv)}
                            className="text-xs text-emerald-700 focus:text-emerald-800 focus:bg-emerald-50 cursor-pointer font-semibold"
                          >
                            <MessageCircle className="h-3.5 w-3.5 mr-2 text-emerald-600" />
                            Share on WhatsApp
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild className="text-xs cursor-pointer">
                            <a
                              href={`/api/invoices/${inv.id}/pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Printer className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              Print Invoice
                            </a>
                          </DropdownMenuItem>

                          {inv.status !== InvoiceStatus.CANCELLED && (
                            <DropdownMenuItem asChild className="text-xs cursor-pointer">
                              <Link href={`/invoices/${inv.id}/edit`} prefetch={true}>
                                <Edit3 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                                Edit Bill
                                {isCashier && <span className="ml-auto text-[10px] text-slate-400">🔒</span>}
                              </Link>
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          {inv.status !== InvoiceStatus.CANCELLED && (
                            <DropdownMenuItem
                              onClick={() => setCancellingInvoice(inv)}
                              className="text-xs text-amber-700 focus:text-amber-800 focus:bg-amber-50 cursor-pointer"
                            >
                              <Ban className="h-3.5 w-3.5 mr-2" />
                              Cancel Invoice
                              {isCashier && <span className="ml-auto text-[10px] text-slate-400">🔒</span>}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => setDeletingInvoice(inv)}
                            className="text-xs text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete Permanently
                            {isCashier && <span className="ml-auto text-[10px] text-slate-400">🔒</span>}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* CANCEL CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(cancellingInvoice)}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingInvoice(null);
            setCancelPassword("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Cancel Invoice #{cancellingInvoice?.invoiceNo}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500 space-y-2">
              <span>
                Are you sure you want to cancel this invoice? This will mark the bill as
                CANCELLED and restore product inventory quantities where applicable.
              </span>
              {isCashier && (
                <span className="block p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] font-medium">
                  🔒 Owner Authorization Required: Enter the Store Owner password below to confirm.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {isCashier && (
            <div className="py-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Store Owner Password:
              </label>
              <Input
                type="password"
                value={cancelPassword}
                onChange={(e) => setCancelPassword(e.target.value)}
                placeholder="Enter owner password..."
                className="h-9 text-xs"
                autoFocus
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isCancelling}
              onClick={() => {
                setCancellingInvoice(null);
                setCancelPassword("");
              }}
              className="text-xs h-9"
            >
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling || (isCashier && !cancelPassword.trim())}
              onClick={() => cancellingInvoice && handleCancelInvoice(cancellingInvoice)}
              className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PERMANENT DELETE CONFIRMATION DIALOG */}
      {deletingInvoice && (
        <DeleteInvoiceDialog
          invoiceId={deletingInvoice.id}
          invoiceNo={deletingInvoice.invoiceNo}
          open={Boolean(deletingInvoice)}
          onOpenChange={(open) => !open && setDeletingInvoice(null)}
          onSuccess={() => {
            setInvoices((prev) => prev.filter((i) => i.id !== deletingInvoice.id));
            setDeletingInvoice(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
