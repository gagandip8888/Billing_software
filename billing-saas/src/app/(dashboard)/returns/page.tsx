"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Package,
  Calendar,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  Tag,
  Receipt,
  Printer,
  MessageCircle,
  Check,
  ExternalLink,
  Building2,
  Phone,
  MapPin,
  CreditCard,
  Wallet,
  ShieldCheck,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface InvoiceItemData {
  id: string;
  productId: string;
  name: string;
  soldQty: number;
  alreadyReturnedQty: number;
  availableReturnQty: number;
  unitBasePrice: number;
  taxRate: number;
  unitTax: number;
  unitTotal: number;
  total: number;
  currentStock: number | null;
}

interface FullInvoiceData {
  id: string;
  invoiceNo: string;
  date: string;
  paymentMode: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  customer: {
    id: string;
    name: string;
    mobile: string;
    address?: string;
    creditBalance: number;
    totalSpent: number;
  };
  items: InvoiceItemData[];
  previousReturns: Array<{
    id: string;
    returnNo: string;
    returnDate: string;
    totalAmount: number;
    refundMode: string;
    reason?: string | null;
    itemsCount: number;
  }>;
  totalReturnedAmount: number;
  isFullyReturned: boolean;
}

interface PastReturn {
  id: string;
  returnNo: string;
  returnDate: string;
  totalAmount: number;
  refundMode: string;
  reason?: string | null;
  productId?: string | null;
  productName?: string | null;
  creditNoteId?: string | null;
  invoice: {
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    paymentMode: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    customer?: {
      id: string;
      name: string;
      mobile: string;
      creditBalance: number;
      address?: string;
    } | null;
  };
  items: Array<{
    id: string;
    productId?: string | null;
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;
}

export interface ReturnReceiptData {
  returnNo: string;
  returnDate: string;
  originalInvoiceNo: string;
  originalInvoiceDate: string;
  originalPaymentMode: string;
  customerName: string;
  customerMobile?: string;
  customerAddress?: string;
  customerCreditBalance?: number;
  previousUdhari?: number;
  updatedUdhari?: number;
  items: Array<{
    name: string;
    qty: number;
    unitBasePrice: number;
    taxRate: number;
    taxAmount: number;
    total: number;
  }>;
  totalBaseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  refundMode: string;
  creditNoteNo?: string | null;
  reason?: string;
  tenant?: {
    businessName: string;
    ownerName?: string;
    mobile: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    gstNo?: string;
  };
}

export default function ReturnsPage() {
  // Return receipt view modal state
  const [activeReturnReceipt, setActiveReturnReceipt] = useState<ReturnReceiptData | null>(null);

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [matchingInvoices, setMatchingInvoices] = useState<FullInvoiceData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Active Selected Bill for return
  const [selectedBill, setSelectedBill] = useState<FullInvoiceData | null>(null);

  // Selected item returns: map of itemId -> { selected: boolean, qty: number }
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, { selected: boolean; qty: number }>>({});

  // Return options
  const [refundMode, setRefundMode] = useState<string>("CREDIT_NOTE");
  const [returnReason, setReturnReason] = useState<string>("damage");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenant shop details
  const [tenantInfo, setTenantInfo] = useState<any>(null);

  // Past returns list
  const [pastReturns, setPastReturns] = useState<PastReturn[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);
  const [pastSearchQuery, setPastSearchQuery] = useState("");

  // Load past returns and tenant details
  async function loadPastReturns() {
    setIsLoadingReturns(true);
    try {
      const res = await fetch("/api/returns");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load returns");
      setPastReturns(data.returns || []);
      if (data.tenant) setTenantInfo(data.tenant);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch sales returns");
    } finally {
      setIsLoadingReturns(false);
    }
  }

  useEffect(() => {
    loadPastReturns();
  }, []);

  // Search candidate bills
  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = searchInput.trim();
    if (!query) {
      toast.error("Please enter an Invoice No, Customer Mobile/Name, or Product Name");
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      setSelectedBill(null);
      setSelectedItemsMap({});

      const res = await fetch(`/api/returns/by-product?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setMatchingInvoices([]);
        toast.error(data.error || "No matching invoices found");
        return;
      }

      const invs: FullInvoiceData[] = data.invoices || [];
      setMatchingInvoices(invs);
      if (data.tenant) setTenantInfo(data.tenant);

      if (invs.length > 0) {
        selectInvoice(invs[0]);
        toast.success(`Found ${invs.length} matching invoice(s)`);
      } else {
        toast.info(`No active invoices found matching "${query}"`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search invoices");
    } finally {
      setIsSearching(false);
    }
  }

  // Choose an invoice to work on
  function selectInvoice(inv: FullInvoiceData) {
    setSelectedBill(inv);
    // Initialize item map: select all items that have available returnable qty
    const initialMap: Record<string, { selected: boolean; qty: number }> = {};
    inv.items.forEach((item) => {
      initialMap[item.id] = {
        selected: item.availableReturnQty > 0,
        qty: item.availableReturnQty > 0 ? 1 : 0,
      };
    });
    setSelectedItemsMap(initialMap);

    // Auto-select refund mode:
    // If original bill was CREDIT or customer has pending credit balance, default to UDHARI_DEDUCTION
    if (inv.paymentMode === "CREDIT" || inv.balanceAmount > 0 || (inv.customer?.creditBalance || 0) > 0) {
      setRefundMode("UDHARI_DEDUCTION");
    } else {
      setRefundMode("CREDIT_NOTE");
    }
  }

  // Toggle item selection
  function toggleItemSelection(itemId: string) {
    setSelectedItemsMap((prev) => {
      const current = prev[itemId] || { selected: false, qty: 1 };
      return {
        ...prev,
        [itemId]: {
          ...current,
          selected: !current.selected,
          qty: !current.selected && current.qty === 0 ? 1 : current.qty,
        },
      };
    });
  }

  // Handle return qty change
  function handleItemQtyChange(itemId: string, maxQty: number, val: string) {
    const parsed = Math.max(0, Math.min(maxQty, Number(val) || 0));
    setSelectedItemsMap((prev) => ({
      ...prev,
      [itemId]: {
        selected: parsed > 0,
        qty: parsed,
      },
    }));
  }

  // Calculate live return totals
  const returnCalculations = useMemo(() => {
    if (!selectedBill) return { items: [], totalBase: 0, totalTax: 0, grandTotal: 0 };

    let totalBase = 0;
    let totalTax = 0;
    let grandTotal = 0;
    const itemsList: Array<{
      item: InvoiceItemData;
      returnQty: number;
      baseAmount: number;
      taxAmount: number;
      totalAmount: number;
    }> = [];

    selectedBill.items.forEach((item) => {
      const state = selectedItemsMap[item.id];
      if (state && state.selected && state.qty > 0) {
        const qty = Math.min(state.qty, item.availableReturnQty);
        const baseAmount = Math.round(item.unitBasePrice * qty * 100) / 100;
        const taxAmount = Math.round(item.unitTax * qty * 100) / 100;
        const itemTotal = Math.round((baseAmount + taxAmount) * 100) / 100;

        totalBase += baseAmount;
        totalTax += taxAmount;
        grandTotal += itemTotal;

        itemsList.push({
          item,
          returnQty: qty,
          baseAmount,
          taxAmount,
          totalAmount: itemTotal,
        });
      }
    });

    return {
      items: itemsList,
      totalBase: Math.round(totalBase * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [selectedBill, selectedItemsMap]);

  // Submit Process Return
  async function handleProcessReturn() {
    if (!selectedBill) {
      toast.error("Please search and select an invoice");
      return;
    }

    if (returnCalculations.items.length === 0) {
      toast.error("Please select at least one product and enter a return quantity > 0");
      return;
    }

    try {
      setIsSubmitting(true);
      const finalReason = returnReason === "other" && customReason.trim() ? customReason.trim() : returnReason;

      const payload = {
        invoiceId: selectedBill.id,
        refundMode,
        reason: finalReason,
        itemsToReturn: returnCalculations.items.map((it) => ({
          id: it.item.id,
          invoiceItemId: it.item.id,
          productId: it.item.productId,
          name: it.item.name,
          qty: it.returnQty,
          price: it.item.unitBasePrice,
        })),
      };

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process return");

      toast.success(
        `Return ${data.salesReturn.returnNo} processed successfully! Stock restored for ${returnCalculations.items.length} item(s).`
      );

      // Trigger global inventory & dashboard updates
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
        window.dispatchEvent(new CustomEvent("invoices:updated"));
      }

      // Open Return Receipt / Credit Note Modal
      setActiveReturnReceipt({
        returnNo: data.salesReturn.returnNo,
        returnDate: data.salesReturn.returnDate || new Date().toISOString(),
        originalInvoiceNo: selectedBill.invoiceNo,
        originalInvoiceDate: selectedBill.date,
        originalPaymentMode: selectedBill.paymentMode,
        customerName: selectedBill.customer?.name || "Walk-in Customer",
        customerMobile: selectedBill.customer?.mobile || "",
        customerAddress: selectedBill.customer?.address || "",
        customerCreditBalance: data.customerBalance?.updated ?? selectedBill.customer?.creditBalance,
        previousUdhari: data.customerBalance?.previous ?? selectedBill.customer?.creditBalance,
        updatedUdhari: data.customerBalance?.updated ?? Math.max(0, (selectedBill.customer?.creditBalance || 0) - returnCalculations.grandTotal),
        items: returnCalculations.items.map((it) => ({
          name: it.item.name,
          qty: it.returnQty,
          unitBasePrice: it.item.unitBasePrice,
          taxRate: it.item.taxRate,
          taxAmount: it.taxAmount,
          total: it.totalAmount,
        })),
        totalBaseAmount: returnCalculations.totalBase,
        totalTaxAmount: returnCalculations.totalTax,
        totalAmount: returnCalculations.grandTotal,
        refundMode: data.salesReturn.refundMode || refundMode,
        creditNoteNo: data.creditNote?.creditNoteNo || null,
        reason: finalReason,
        tenant: data.tenant || tenantInfo,
      });

      // Clear search and selections
      setSearchInput("");
      setMatchingInvoices([]);
      setSelectedBill(null);
      setSelectedItemsMap({});
      setHasSearched(false);

      // Reload past returns
      loadPastReturns();
    } catch (err: any) {
      toast.error(err.message || "Failed to process return");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filtered past returns
  const filteredPastReturns = useMemo(() => {
    const q = pastSearchQuery.toLowerCase().trim();
    if (!q) return pastReturns;
    return pastReturns.filter((r) => {
      return (
        r.returnNo.toLowerCase().includes(q) ||
        r.invoice.invoiceNo.toLowerCase().includes(q) ||
        (r.invoice.customer?.name && r.invoice.customer.name.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        (r.productName && r.productName.toLowerCase().includes(q)) ||
        r.items.some((i) => i.name.toLowerCase().includes(q))
      );
    });
  }, [pastReturns, pastSearchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-indigo-600" />
            Sales Returns & Credit Notes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search invoices, select returned products, auto-restore inventory stock, and deduct customer Udhari
          </p>
        </div>

        <Badge variant="outline" className="h-7 px-3 bg-emerald-50 text-emerald-700 border-emerald-200 self-start sm:self-auto font-semibold text-xs gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Stock & Udhari Auto-Sync Active
        </Badge>
      </div>

      {/* 2. Process Return Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Step 1: Search Original Sales Bill</h2>
            <p className="text-xs text-slate-500">
              Enter <strong>Invoice Number (e.g. INV-0001)</strong>, Customer Mobile, Customer Name, or Product Name
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Bill # (e.g. INV-0001), Customer Mobile (e.g. 9876543210), or Product Name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm font-medium"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearching || !searchInput.trim()}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shrink-0"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Find Bill
          </Button>
        </form>

        {/* Multiple Invoice Matches Selector (if search returned > 1) */}
        {matchingInvoices.length > 1 && (
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-bold text-slate-700">
              Multiple bills matched. Choose the invoice to process:
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {matchingInvoices.map((inv) => {
                const isSelected = selectedBill?.id === inv.id;
                return (
                  <div
                    key={inv.id}
                    onClick={() => selectInvoice(inv)}
                    className={`p-3 rounded-lg border cursor-pointer transition text-xs space-y-1 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono">
                      <strong className="text-indigo-700 font-bold">{inv.invoiceNo}</strong>
                      <span className="text-[10px] text-slate-400">
                        {new Date(inv.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-800 truncate">
                      {inv.customer?.name || "Walk-in Customer"}
                    </div>
                    <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
                      <span>Total: <strong className="text-slate-800 font-mono">₹{inv.totalAmount.toFixed(2)}</strong></span>
                      <Badge variant="outline" className={`text-[10px] ${inv.paymentMode === "CREDIT" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                        {inv.paymentMode === "CREDIT" ? "Udhari" : inv.paymentMode}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results Fallback */}
        {hasSearched && matchingInvoices.length === 0 && !isSearching && (
          <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Sales Bill Found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No active invoice was found matching &quot;{searchInput}&quot;. Please check the Bill No or customer mobile.
            </p>
          </div>
        )}

        {/* Selected Bill Details & Multi-Product Return Form */}
        {selectedBill && (
          <div className="space-y-5 pt-3 border-t border-slate-200">
            {/* Bill Overview Header Card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-700 bg-white px-2.5 py-1 rounded border border-indigo-200">
                    Bill #{selectedBill.invoiceNo}
                  </span>
                  <span className="text-xs text-slate-500">
                    Dated:{" "}
                    <strong>
                      {new Date(selectedBill.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${
                      selectedBill.paymentMode === "CREDIT"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : "bg-emerald-100 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    Payment: {selectedBill.paymentMode === "CREDIT" ? "Credit (Udhari)" : selectedBill.paymentMode}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs font-semibold bg-white text-slate-700 border-slate-300"
                  >
                    Status: {selectedBill.status}
                  </Badge>
                </div>
              </div>

              {/* Customer & Financial Ledger Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Name</span>
                  <strong className="text-slate-900 block truncate text-sm">
                    {selectedBill.customer?.name || "Walk-in Customer"}
                  </strong>
                  {selectedBill.customer?.mobile && (
                    <span className="text-[11px] text-slate-500">{selectedBill.customer.mobile}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bill Total</span>
                  <strong className="text-slate-900 font-mono text-sm block">
                    ₹{selectedBill.totalAmount.toFixed(2)}
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    Paid: ₹{selectedBill.paidAmount.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Bill Pending Balance</span>
                  <strong
                    className={`font-mono text-sm block ${
                      selectedBill.balanceAmount > 0 ? "text-amber-700 font-bold" : "text-emerald-700"
                    }`}
                  >
                    ₹{selectedBill.balanceAmount.toFixed(2)}
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    {selectedBill.balanceAmount > 0 ? "Pending to be paid" : "Fully Settled"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Udhari (Khata)</span>
                  <strong
                    className={`font-mono text-sm block ${
                      selectedBill.customer?.creditBalance > 0
                        ? "text-red-600 font-black"
                        : "text-slate-800"
                    }`}
                  >
                    ₹{(selectedBill.customer?.creditBalance || 0).toFixed(2)}
                  </strong>
                  {selectedBill.customer?.creditBalance > 0 && (
                    <span className="text-[10px] font-semibold text-red-600">
                      Total Ledger Debt
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Select Items to Return */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Step 2: Select Products to Return from Bill #{selectedBill.invoiceNo}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Check the items customer is returning and enter the return quantity (cannot exceed sold quantity)
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-700">
                  {returnCalculations.items.length} item(s) selected
                </span>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <Table>
                  <TableHeader className="bg-slate-50/80">
                    <TableRow>
                      <TableHead className="w-10 text-center font-bold text-xs text-slate-700">Select</TableHead>
                      <TableHead className="font-bold text-xs text-slate-700">Product Item</TableHead>
                      <TableHead className="text-center font-bold text-xs text-slate-700">Billed Qty</TableHead>
                      <TableHead className="text-center font-bold text-xs text-slate-700">Returned</TableHead>
                      <TableHead className="text-center font-bold text-xs text-slate-700">Available</TableHead>
                      <TableHead className="text-center font-bold text-xs text-indigo-700">Return Qty</TableHead>
                      <TableHead className="text-right font-bold text-xs text-slate-700">Base Rate</TableHead>
                      <TableHead className="text-right font-bold text-xs text-slate-700">GST %</TableHead>
                      <TableHead className="text-right font-bold text-xs text-slate-700">GST Amt</TableHead>
                      <TableHead className="text-right font-bold text-xs text-slate-900">Total Refund</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBill.items.map((item) => {
                      const itemState = selectedItemsMap[item.id] || { selected: false, qty: 0 };
                      const isSelected = itemState.selected;
                      const returnQty = itemState.qty;
                      const isFullyReturned = item.availableReturnQty === 0;

                      const baseAmount = Math.round(item.unitBasePrice * returnQty * 100) / 100;
                      const taxAmount = Math.round(item.unitTax * returnQty * 100) / 100;
                      const lineTotal = Math.round((baseAmount + taxAmount) * 100) / 100;

                      return (
                        <TableRow
                          key={item.id}
                          className={`${
                            isSelected
                              ? "bg-indigo-50/30 font-medium"
                              : isFullyReturned
                              ? "bg-slate-50/60 opacity-60"
                              : "hover:bg-slate-50/50"
                          }`}
                        >
                          {/* Checkbox */}
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              disabled={isFullyReturned}
                              checked={isSelected}
                              onChange={() => toggleItemSelection(item.id)}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </TableCell>

                          {/* Product Info */}
                          <TableCell className="text-xs">
                            <span className="font-bold text-slate-900 block">{item.name}</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              SKU: {item.productId}
                              {item.currentStock !== null && (
                                <span className="ml-2 text-slate-500">
                                  Current Stock: <strong>{item.currentStock}</strong>
                                </span>
                              )}
                            </span>
                          </TableCell>

                          {/* Billed Qty */}
                          <TableCell className="text-center font-mono text-xs font-semibold text-slate-700">
                            {item.soldQty}
                          </TableCell>

                          {/* Already Returned */}
                          <TableCell className="text-center text-xs">
                            {item.alreadyReturnedQty > 0 ? (
                              <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 font-mono">
                                {item.alreadyReturnedQty} returned
                              </Badge>
                            ) : (
                              <span className="text-slate-400 text-xs">0</span>
                            )}
                          </TableCell>

                          {/* Available to Return */}
                          <TableCell className="text-center font-mono text-xs font-bold text-slate-800">
                            {item.availableReturnQty}
                          </TableCell>

                          {/* Return Qty Input */}
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min={1}
                              max={item.availableReturnQty}
                              disabled={!isSelected || isFullyReturned}
                              value={isSelected ? returnQty || "" : ""}
                              onChange={(e) =>
                                handleItemQtyChange(item.id, item.availableReturnQty, e.target.value)
                              }
                              className={`h-8 w-20 text-center font-mono font-bold text-xs mx-auto ${
                                isSelected ? "bg-white border-indigo-400 text-indigo-950 ring-1 ring-indigo-300" : "bg-slate-100"
                              }`}
                            />
                          </TableCell>

                          {/* Base Rate */}
                          <TableCell className="text-right font-mono text-xs text-slate-600">
                            ₹{item.unitBasePrice.toFixed(2)}
                          </TableCell>

                          {/* GST % */}
                          <TableCell className="text-right font-mono text-xs text-slate-600">
                            {item.taxRate}%
                          </TableCell>

                          {/* GST Amt */}
                          <TableCell className="text-right font-mono text-xs text-slate-600">
                            ₹{isSelected ? taxAmount.toFixed(2) : "0.00"}
                          </TableCell>

                          {/* Line Refund Total */}
                          <TableCell className="text-right font-mono text-xs font-bold text-indigo-900">
                            ₹{isSelected ? lineTotal.toFixed(2) : "0.00"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Step 3: Refund Options & Return Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {/* Refund Method */}
              <div className="space-y-1.5">
                <Label htmlFor="refundModeSelect" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Wallet className="h-3.5 w-3.5 text-indigo-600" />
                  Refund / Settlement Method <span className="text-red-500">*</span>
                </Label>
                <Select value={refundMode} onValueChange={setRefundMode}>
                  <SelectTrigger id="refundModeSelect" className="h-9 text-xs bg-white font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(selectedBill.paymentMode === "CREDIT" ||
                      selectedBill.balanceAmount > 0 ||
                      (selectedBill.customer?.creditBalance || 0) > 0) && (
                      <SelectItem value="UDHARI_DEDUCTION" className="text-xs font-bold text-amber-900">
                        Deduct from Customer Udhari (Khata Balance)
                      </SelectItem>
                    )}
                    <SelectItem value="CREDIT_NOTE" className="text-xs font-semibold text-purple-900">
                      Store Credit Note (Voucher for next bill)
                    </SelectItem>
                    <SelectItem value="CASH" className="text-xs font-medium text-slate-800">
                      Cash Refund
                    </SelectItem>
                    <SelectItem value="UPI" className="text-xs font-medium text-slate-800">
                      UPI / Digital Refund
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Explanatory helper message for refund mode */}
                {refundMode === "UDHARI_DEDUCTION" && (
                  <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                    Customer Udhari will be deducted by{" "}
                    <strong>₹{returnCalculations.grandTotal.toFixed(2)}</strong>.
                    Current balance: ₹{(selectedBill.customer?.creditBalance || 0).toFixed(2)} → New balance: ₹
                    {Math.max(0, (selectedBill.customer?.creditBalance || 0) - returnCalculations.grandTotal).toFixed(2)}.
                  </p>
                )}
                {refundMode === "CREDIT_NOTE" && (
                  <p className="text-[11px] text-purple-800 font-medium bg-purple-50 p-2 rounded border border-purple-200 mt-1">
                    A formal Store Credit Note (CN-xxxx) will be generated. The customer can redeem this voucher on their next purchase.
                  </p>
                )}
              </div>

              {/* Return Reason */}
              <div className="space-y-1.5">
                <Label htmlFor="returnReasonSelect" className="text-xs font-bold text-slate-800">
                  Reason for Return <span className="text-red-500">*</span>
                </Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger id="returnReasonSelect" className="h-9 text-xs bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Damage / Defective Product</SelectItem>
                    <SelectItem value="wrong_size">Wrong Size / Fit Issue</SelectItem>
                    <SelectItem value="wrong_color">Wrong Color / Variant</SelectItem>
                    <SelectItem value="customer_changed_mind">Customer Changed Mind</SelectItem>
                    <SelectItem value="quality_issue">Quality / Performance Issue</SelectItem>
                    <SelectItem value="other">Other Reason</SelectItem>
                  </SelectContent>
                </Select>

                {returnReason === "other" && (
                  <Input
                    placeholder="Describe specific return reason..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="h-8 text-xs bg-white mt-1.5"
                  />
                )}
              </div>
            </div>

            {/* Step 4: Clear GST Breakdown & Return Action Card */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="text-slate-600 flex items-center gap-3">
                    <span>
                      Taxable Return Subtotal:{" "}
                      <strong className="text-slate-900 font-mono font-bold">
                        ₹{returnCalculations.totalBase.toFixed(2)}
                      </strong>
                    </span>
                    <span>&bull;</span>
                    <span>
                      GST Return Tax:{" "}
                      <strong className="text-slate-900 font-mono font-bold">
                        ₹{returnCalculations.totalTax.toFixed(2)}
                      </strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-700 flex items-center gap-1.5 font-medium">
                    <Package className="h-3.5 w-3.5" />
                    Stock for {returnCalculations.items.length} selected product(s) will be automatically incremented (+)
                  </div>
                </div>

                {/* Big Grand Total */}
                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 block">
                    Total Refundable Amount (Incl. GST)
                  </span>
                  <div className="text-2xl font-black font-mono text-indigo-950">
                    ₹{returnCalculations.grandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-indigo-200/80">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBill(null);
                    setSelectedItemsMap({});
                  }}
                  disabled={isSubmitting}
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleProcessReturn}
                  disabled={isSubmitting || returnCalculations.items.length === 0}
                  className="h-9 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing Return...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Process Sales Return (₹{returnCalculations.grandTotal.toFixed(2)})
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Past Returns History Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Past Returns & Credit Notes History</h2>
            <p className="text-xs text-slate-500">Audit trail of all returned items, inventory restorations, and customer ledger adjustments</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter by return #, bill, item, or customer..."
              value={pastSearchQuery}
              onChange={(e) => setPastSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
        </div>

        {isLoadingReturns ? (
          <div className="text-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
            <span className="text-xs text-slate-500">Loading returns history...</span>
          </div>
        ) : filteredPastReturns.length === 0 ? (
          <div className="text-center py-10">
            <RotateCcw className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Sales Returns Found</p>
            <p className="text-[11px] text-slate-400">Processed returns will appear here with printable receipts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">Return No</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Original Bill & Customer</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Returned Products</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Reason</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Refund Settlement</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Refund Total</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPastReturns.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50/60">
                    <TableCell className="font-mono text-xs font-bold text-indigo-700">
                      {r.returnNo}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(r.returnDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-bold text-slate-800 block">
                        {r.invoice.customer?.name || "Walk-in Customer"}
                      </span>
                      <span className="font-mono text-[11px] text-indigo-700 font-semibold">
                        Bill #{r.invoice.invoiceNo}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800 max-w-xs">
                      {r.items.map((it) => (
                        <div key={it.id} className="text-[11px]">
                          <strong>{it.name}</strong> ({it.qty} pc &bull; ₹{Number(it.total).toFixed(2)})
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 capitalize">
                      {r.reason?.replace(/_/g, " ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          r.refundMode === "UDHARI_DEDUCTION"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : r.refundMode === "CREDIT_NOTE" || r.refundMode === "CREDIT"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {r.refundMode === "UDHARI_DEDUCTION"
                          ? "Deducted from Udhari"
                          : r.refundMode === "CREDIT_NOTE" || r.refundMode === "CREDIT"
                          ? "Store Credit Note"
                          : r.refundMode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-black text-slate-900">
                      ₹{r.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setActiveReturnReceipt({
                            returnNo: r.returnNo,
                            returnDate: r.returnDate,
                            originalInvoiceNo: r.invoice.invoiceNo,
                            originalInvoiceDate: r.invoice.invoiceDate,
                            originalPaymentMode: r.invoice.paymentMode,
                            customerName: r.invoice.customer?.name || "Walk-in Customer",
                            customerMobile: r.invoice.customer?.mobile || "",
                            customerAddress: r.invoice.customer?.address || "",
                            customerCreditBalance: r.invoice.customer?.creditBalance,
                            items: r.items.map((it) => ({
                              name: it.name,
                              qty: it.qty,
                              unitBasePrice: it.price,
                              taxRate: 0,
                              taxAmount: 0,
                              total: it.total,
                            })),
                            totalBaseAmount: r.totalAmount,
                            totalTaxAmount: 0,
                            totalAmount: r.totalAmount,
                            refundMode: r.refundMode,
                            creditNoteNo: r.creditNoteId ? "CN-CREDIT" : undefined,
                            reason: r.reason || undefined,
                            tenant: tenantInfo,
                          })
                        }
                        className="h-7 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                      >
                        <Receipt className="h-3 w-3" /> View Receipt
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 4. PROFESSIONAL RETURN RECEIPT / CREDIT NOTE MODAL */}
      <Dialog
        open={Boolean(activeReturnReceipt)}
        onOpenChange={(open) => !open && setActiveReturnReceipt(null)}
      >
        <DialogContent className="max-w-lg p-0 bg-white text-slate-900 border-slate-300 overflow-hidden shadow-2xl">
          {activeReturnReceipt && (
            <div>
              {/* Receipt Printable Container */}
              <div id="return-receipt-print-area" className="p-6 space-y-4 text-xs font-sans">
                {/* Shop Header */}
                <div className="text-center pb-3 border-b-2 border-slate-900 space-y-0.5">
                  <h2 className="text-lg font-black uppercase tracking-wide text-slate-950">
                    {activeReturnReceipt.tenant?.businessName || "RETAIL STORE"}
                  </h2>
                  {activeReturnReceipt.tenant?.address && (
                    <p className="text-[11px] text-slate-600">
                      {activeReturnReceipt.tenant.address}
                      {activeReturnReceipt.tenant.city ? `, ${activeReturnReceipt.tenant.city}` : ""}
                      {activeReturnReceipt.tenant.state ? ` (${activeReturnReceipt.tenant.state})` : ""}
                      {activeReturnReceipt.tenant.pincode ? ` - ${activeReturnReceipt.tenant.pincode}` : ""}
                    </p>
                  )}
                  <div className="flex items-center justify-center gap-3 text-[11px] text-slate-600 font-medium">
                    {activeReturnReceipt.tenant?.mobile && <span>Phone: {activeReturnReceipt.tenant.mobile}</span>}
                    {activeReturnReceipt.tenant?.gstNo && <span>GSTIN: {activeReturnReceipt.tenant.gstNo}</span>}
                  </div>

                  {/* Document Badge */}
                  <div className="pt-2">
                    <span className="inline-block uppercase tracking-wider text-[11px] font-black px-3 py-0.5 bg-slate-900 text-white rounded">
                      {activeReturnReceipt.refundMode === "CREDIT_NOTE" || activeReturnReceipt.refundMode === "CREDIT"
                        ? "CREDIT NOTE VOUCHER"
                        : "SALES RETURN RECEIPT"}
                    </span>
                  </div>
                </div>

                {/* Reference Details Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs pb-3 border-b border-slate-200">
                  <div className="space-y-0.5">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Return Reference</div>
                    <div>
                      Return No: <strong className="font-mono text-slate-900">{activeReturnReceipt.returnNo}</strong>
                    </div>
                    {activeReturnReceipt.creditNoteNo && (
                      <div>
                        Credit Note No: <strong className="font-mono text-purple-700">{activeReturnReceipt.creditNoteNo}</strong>
                      </div>
                    )}
                    <div>
                      Date:{" "}
                      <span className="text-slate-700">
                        {new Date(activeReturnReceipt.returnDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-slate-500 text-[10px] uppercase font-bold">Original Invoice</div>
                    <div>
                      Original Bill: <strong className="font-mono text-indigo-700">#{activeReturnReceipt.originalInvoiceNo}</strong>
                    </div>
                    <div>
                      Original Mode: <span className="font-semibold text-slate-700">{activeReturnReceipt.originalPaymentMode}</span>
                    </div>
                    {activeReturnReceipt.reason && (
                      <div className="text-[11px] text-slate-600 capitalize">
                        Reason: {activeReturnReceipt.reason.replace(/_/g, " ")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer Information</span>
                  <div className="font-bold text-slate-900 text-xs">
                    {activeReturnReceipt.customerName}
                    {activeReturnReceipt.customerMobile ? ` (${activeReturnReceipt.customerMobile})` : ""}
                  </div>
                  {activeReturnReceipt.customerAddress && (
                    <div className="text-[11px] text-slate-500">{activeReturnReceipt.customerAddress}</div>
                  )}
                </div>

                {/* Returned Products Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-2.5">Item</th>
                        <th className="py-2 px-2.5 text-center">Qty</th>
                        <th className="py-2 px-2.5 text-right">Rate</th>
                        {activeReturnReceipt.totalTaxAmount > 0 && (
                          <th className="py-2 px-2.5 text-right">GST %</th>
                        )}
                        <th className="py-2 px-2.5 text-right">Refund Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeReturnReceipt.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-2.5 font-semibold text-slate-900">{it.name}</td>
                          <td className="py-2 px-2.5 text-center font-mono">{it.qty}</td>
                          <td className="py-2 px-2.5 text-right font-mono">₹{it.unitBasePrice.toFixed(2)}</td>
                          {activeReturnReceipt.totalTaxAmount > 0 && (
                            <td className="py-2 px-2.5 text-right font-mono">{it.taxRate}%</td>
                          )}
                          <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{it.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Summary Box */}
                <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  {activeReturnReceipt.totalTaxAmount > 0 && (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxable Value:</span>
                        <span className="font-mono">₹{activeReturnReceipt.totalBaseAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Total GST Refund:</span>
                        <span className="font-mono">₹{activeReturnReceipt.totalTaxAmount.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-300 font-bold text-slate-900 text-sm">
                    <span>Total Refund / Credit:</span>
                    <span className="font-mono font-black text-indigo-700 text-base">
                      ₹{activeReturnReceipt.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Settlement Information Callout */}
                <div className="p-2.5 rounded-lg border text-xs space-y-1 bg-purple-50/60 border-purple-200">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-950">Settlement Method:</span>
                    <Badge variant="outline" className="font-bold text-[11px] bg-white text-purple-800 border-purple-300">
                      {activeReturnReceipt.refundMode === "UDHARI_DEDUCTION"
                        ? "Deducted from Udhari (Khata)"
                        : activeReturnReceipt.refundMode === "CREDIT_NOTE" || activeReturnReceipt.refundMode === "CREDIT"
                        ? "Store Credit Note"
                        : `${activeReturnReceipt.refundMode} Refund`}
                    </Badge>
                  </div>

                  {activeReturnReceipt.refundMode === "UDHARI_DEDUCTION" && activeReturnReceipt.updatedUdhari !== undefined && (
                    <div className="text-[11px] text-amber-900 font-medium pt-1 border-t border-purple-200/60 flex justify-between">
                      <span>Updated Customer Udhari Balance:</span>
                      <strong className="font-mono text-red-600">
                        ₹{activeReturnReceipt.updatedUdhari.toFixed(2)}
                      </strong>
                    </div>
                  )}

                  {activeReturnReceipt.creditNoteNo && (
                    <div className="text-[11px] text-purple-800 pt-1">
                      Store Credit Voucher <strong className="font-mono">{activeReturnReceipt.creditNoteNo}</strong> can be redeemed on your next purchase.
                    </div>
                  )}
                </div>

                {/* Footer Signature */}
                <div className="pt-4 flex justify-between items-end text-[10px] text-slate-500 border-t border-slate-200">
                  <div>
                    <p>Computer Generated Return Receipt</p>
                    <p>Goods received in good condition.</p>
                  </div>
                  <div className="text-right">
                    <div className="h-6 border-b border-slate-400 w-28 mb-1"></div>
                    <span>Authorized Signatory</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => window.print()}
                  className="h-9 text-xs font-bold border-slate-300 text-slate-800 gap-1.5 bg-white"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Receipt
                </Button>

                {(() => {
                  const mob = (activeReturnReceipt.customerMobile || "").replace(/\D/g, "").slice(-10);
                  const itemsListText = activeReturnReceipt.items
                    .map((it) => `- ${it.name} (${it.qty} pc) = ₹${it.total.toFixed(2)}`)
                    .join("\n");
                  const settlementText =
                    activeReturnReceipt.refundMode === "UDHARI_DEDUCTION"
                      ? `Settlement: Deducted from Udhari (Khata). New Udhari Balance: ₹${(activeReturnReceipt.updatedUdhari || 0).toFixed(2)}`
                      : activeReturnReceipt.creditNoteNo
                      ? `Settlement: Store Credit Voucher #${activeReturnReceipt.creditNoteNo} issued.`
                      : `Settlement: ${activeReturnReceipt.refundMode} Refund.`;

                  const msg = `*SALES RETURN RECEIPT*\nStore: ${activeReturnReceipt.tenant?.businessName || "Retail Store"}\nReturn No: #${activeReturnReceipt.returnNo}\nOriginal Bill: #${activeReturnReceipt.originalInvoiceNo}\nCustomer: ${activeReturnReceipt.customerName}\n\nReturned Products:\n${itemsListText}\n\n*Total Refund Amount: ₹${activeReturnReceipt.totalAmount.toFixed(2)}*\n${settlementText}\n\nThank you for shopping with us!`;

                  const waUrl = mob
                    ? `https://wa.me/91${mob}?text=${encodeURIComponent(msg)}`
                    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

                  return (
                    <a href={waUrl} target="_blank" rel="noopener noreferrer">
                      <Button
                        type="button"
                        className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Share on WhatsApp
                      </Button>
                    </a>
                  );
                })()}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setActiveReturnReceipt(null)}
                  className="h-9 text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
