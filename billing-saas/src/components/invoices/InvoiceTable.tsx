"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
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
}

interface InvoiceTableProps {
  initialInvoices: SerializedInvoice[];
  businessName: string;
}

export function InvoiceTable({
  initialInvoices,
  businessName,
}: InvoiceTableProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SerializedInvoice[]>(initialInvoices);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [cancellingInvoice, setCancellingInvoice] =
    useState<SerializedInvoice | null>(null);
  const [deletingInvoice, setDeletingInvoice] =
    useState<SerializedInvoice | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const { pendingCount, isSyncing, syncNow, isOnline } = useOfflineSync();

  // Sync state if server data refreshes
  React.useEffect(() => {
    setInvoices(initialInvoices);
  }, [initialInvoices]);

  // Auto-refresh server list when an offline invoice completes sync
  React.useEffect(() => {
    const handleSyncComplete = () => {
      router.refresh();
    };
    window.addEventListener("billingsaas:sync-complete", handleSyncComplete);
    return () => {
      window.removeEventListener("billingsaas:sync-complete", handleSyncComplete);
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
          inv.customer?.name.toLowerCase().includes(q) ||
          inv.customer?.mobile.toLowerCase().includes(q) ||
          (inv.metadata?.walkInCustomerName || "").toLowerCase().includes(q) ||
          (inv.metadata?.walkInCustomerMobile || "").toLowerCase().includes(q);
        const matchesNotes = inv.notes?.toLowerCase().includes(q);

        if (!matchesNo && !matchesCust && !matchesNotes) {
          return false;
        }
      }

      // Status
      if (statusFilter !== "ALL" && inv.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [invoices, searchQuery, statusFilter]);

  async function handleCancelInvoice(invoice: SerializedInvoice) {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "DELETE",
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

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search invoice #, customer, mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="w-36">
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

        <div className="flex items-center gap-2">
          <Link href="/billing/new">
            <Button className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
              <Plus className="h-3.5 w-3.5" /> + New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* INVOICES TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
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
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        {inv.invoiceNo}
                      </Link>
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
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild className="text-xs cursor-pointer">
                            <Link href={`/invoices/${inv.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              View Bill
                            </Link>
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

                          <DropdownMenuSeparator />
                          {inv.status !== InvoiceStatus.CANCELLED && (
                            <DropdownMenuItem
                              onClick={() => setCancellingInvoice(inv)}
                              className="text-xs text-amber-700 focus:text-amber-800 focus:bg-amber-50 cursor-pointer"
                            >
                              <Ban className="h-3.5 w-3.5 mr-2" />
                              Cancel Invoice
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => setDeletingInvoice(inv)}
                            className="text-xs text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer font-medium"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        onOpenChange={(open) => !open && setCancellingInvoice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Cancel Invoice #{cancellingInvoice?.invoiceNo}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to cancel this invoice? This will mark the bill as
              CANCELLED and restore product inventory quantities where applicable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling} className="text-xs h-9">
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isCancelling}
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
