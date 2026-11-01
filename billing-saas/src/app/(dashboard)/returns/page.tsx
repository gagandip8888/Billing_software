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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface InvoiceMatch {
  invoiceItemId: string;
  invoiceId: string;
  invoiceNo: string;
  date: string;
  customer: {
    id?: string;
    name: string;
    mobile: string;
  } | null;
  qty: number;
  price: number;
  total: number;
  productId: string;
  productName: string;
}

interface ProductDetails {
  id: string;
  productId?: string;
  name: string;
  price: number;
  stockQty: number | null;
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
    customer?: {
      id: string;
      name: string;
      mobile: string;
    } | null;
  };
  items: Array<{
    id: string;
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;
}

export default function ReturnsPage() {
  // Search state
  const [productIdInput, setProductIdInput] = useState("");
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [productData, setProductData] = useState<ProductDetails | null>(null);
  const [candidateInvoices, setCandidateInvoices] = useState<InvoiceMatch[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Return form state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceMatch | null>(null);
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>("damage");
  const [refundMode, setRefundMode] = useState<string>("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Past returns list
  const [pastReturns, setPastReturns] = useState<PastReturn[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);
  const [pastSearchQuery, setPastSearchQuery] = useState("");

  // Load past returns
  async function loadPastReturns() {
    setIsLoadingReturns(true);
    try {
      const res = await fetch("/api/returns");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load returns");
      setPastReturns(data.returns || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch sales returns");
    } finally {
      setIsLoadingReturns(false);
    }
  }

  useEffect(() => {
    loadPastReturns();
  }, []);

  // Search candidate invoices by product ID, product name, customer name, or bill no
  async function handleProductLookup(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const query = productIdInput.trim();
    if (!query) {
      toast.error("Please enter a Product ID, Name, Customer Name, or Bill No to search");
      return;
    }

    try {
      setIsSearchingProduct(true);
      setSelectedInvoice(null);
      setHasSearched(true);

      const res = await fetch(`/api/returns/by-product?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (!res.ok) {
        setProductData(null);
        setCandidateInvoices([]);
        toast.error(data.error || "No matching invoices found");
        return;
      }

      setProductData(data.product);
      setCandidateInvoices(data.invoices || []);

      if (data.invoices && data.invoices.length > 0) {
        setSelectedInvoice(data.invoices[0]);
        setReturnQty(1);
        toast.success(`Found ${data.invoices.length} matching sales invoice(s)`);
      } else {
        toast.info(`No sales recorded matching "${query}" in the last 30 days`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to search invoices");
    } finally {
      setIsSearchingProduct(false);
    }
  }

  // Submit return
  async function handleProcessReturn() {
    if (!selectedInvoice) {
      toast.error("Please select an invoice to return against");
      return;
    }

    if (!returnQty || returnQty <= 0) {
      toast.error("Please enter a valid return quantity");
      return;
    }

    if (returnQty > selectedInvoice.qty) {
      toast.error(`Return quantity cannot exceed sold quantity (${selectedInvoice.qty})`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: selectedInvoice.invoiceId,
          refundMode: refundMode === "CREDIT" ? "CREDIT_NOTE" : refundMode,
          reason: returnReason,
          itemsToReturn: [
            {
              id: selectedInvoice.invoiceItemId,
              name: selectedInvoice.productName,
              qty: returnQty,
              price: selectedInvoice.price,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to process return");

      toast.success(
        `${selectedInvoice.productName} returned from ${selectedInvoice.invoiceNo}! Stock restored (+${returnQty})${
          refundMode === "CREDIT" ? " & Store Credit created" : ""
        }`
      );

      // Trigger real-time product & stock update across navbar & dashboard
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
      }

      // Reset form
      setProductIdInput("");
      setProductData(null);
      setCandidateInvoices([]);
      setSelectedInvoice(null);
      setHasSearched(false);

      // Refresh past returns table
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header (Only "Returns") */}
      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Returns
        </h1>
        <p className="text-xs text-slate-500">
          Search product sales within 30 days, restore stock, and issue refund or store credit
        </p>
      </div>

      {/* 2. Process Return Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <RotateCcw className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">Process Product Return</h2>
            <p className="text-xs text-slate-500">
              Search by <strong>Product ID, Item Name, Customer Name, or Bill No</strong>
            </p>
          </div>
        </div>

        {/* Flexible Multi-Field Search Bar */}
        <form onSubmit={handleProductLookup} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by Product ID, Product Name, Customer Name, or Bill No (e.g. 1023, T-shirt, Ramesh, INV-0009)..."
              value={productIdInput}
              onChange={(e) => setProductIdInput(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={isSearchingProduct || !productIdInput.trim()}
            className="h-10 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1.5 shrink-0"
          >
            {isSearchingProduct ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search Invoices
          </Button>
        </form>

        {/* Product Details Banner if found */}
        {productData && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md bg-white border border-slate-200 flex items-center justify-center font-mono font-bold text-indigo-600">
                {productData.productId || "ID"}
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 block">
                  {productData.name}
                </span>
                <span className="text-slate-500">
                  Current Retail: <strong className="text-slate-800">₹{productData.price}</strong>
                  {productData.stockQty !== null && (
                    <span className="ml-2">· Stock: <strong>{productData.stockQty}</strong></span>
                  )}
                </span>
              </div>
            </div>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
              Eligible (Last 30 Days)
            </Badge>
          </div>
        )}

        {/* Candidate Invoices List */}
        {hasSearched && candidateInvoices.length === 0 && (
          <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Sales Found in Last 30 Days</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              This product was not billed in any active invoices within the 30-day return window.
            </p>
          </div>
        )}

        {candidateInvoices.length > 0 && (
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-bold text-slate-700 block mb-2">
                1. Select Invoice to Return From:
              </Label>
              <div className="space-y-2">
                {candidateInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.invoiceItemId === inv.invoiceItemId;
                  return (
                    <div
                      key={inv.invoiceItemId}
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setReturnQty(1);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50/40 ring-1 ring-indigo-500"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-indigo-900 font-mono">
                            {inv.invoiceNo}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            • {inv.productName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({new Date(inv.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <User className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            Customer: <strong className="text-slate-800">{inv.customer?.name || "Walk-in Customer"}</strong>
                            {inv.customer?.mobile ? ` (${inv.customer.mobile})` : ""}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-slate-500 block text-[11px]">Sold Qty</span>
                          <span className="font-bold text-slate-800">{inv.qty} pc</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 block text-[11px]">Sale Price</span>
                          <span className="font-bold text-slate-900">₹{inv.price.toFixed(2)}</span>
                        </div>
                        <div className="w-5 flex justify-center">
                          <div
                            className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-indigo-600 bg-indigo-600 text-white"
                                : "border-slate-300"
                            }`}
                          >
                            {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return Details Form */}
            {selectedInvoice && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <Label className="text-xs font-bold text-slate-800">
                    2. Return Selected Item Details:
                  </Label>
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded border border-indigo-200">
                    {selectedInvoice.productName} returned from {selectedInvoice.invoiceNo}
                  </span>
                </div>

                {/* Selected Item Overview Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Item Name</span>
                    <strong className="text-slate-900 block truncate">{selectedInvoice.productName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Customer</span>
                    <strong className="text-slate-800 block truncate">{selectedInvoice.customer?.name || "Walk-in"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Original Bill & Date</span>
                    <strong className="text-slate-800 font-mono block">
                      {selectedInvoice.invoiceNo} ({new Date(selectedInvoice.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })})
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">Price & Sold Qty</span>
                    <strong className="text-emerald-700 font-mono block">
                      ₹{selectedInvoice.price.toFixed(2)} &bull; {selectedInvoice.qty} pcs
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Quantity to Return */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Return Qty (Max {selectedInvoice.qty})
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedInvoice.qty}
                      value={returnQty}
                      onChange={(e) =>
                        setReturnQty(
                          Math.max(1, Math.min(selectedInvoice.qty, Number(e.target.value) || 1))
                        )
                      }
                      className="h-9 text-xs bg-white font-mono font-bold"
                    />
                  </div>

                  {/* Reason Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Reason for Return
                    </Label>
                    <Select value={returnReason} onValueChange={setReturnReason}>
                      <SelectTrigger className="h-9 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="damage">Damage / Defective</SelectItem>
                        <SelectItem value="wrong_size">Wrong Size</SelectItem>
                        <SelectItem value="wrong_color">Wrong Color</SelectItem>
                        <SelectItem value="customer_changed_mind">Customer Changed Mind</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Refund Mode */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">
                      Refund Mode
                    </Label>
                    <Select value={refundMode} onValueChange={setRefundMode}>
                      <SelectTrigger className="h-9 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash Refund</SelectItem>
                        <SelectItem value="UPI">UPI / Bank Refund</SelectItem>
                        <SelectItem value="CREDIT">Store Credit Note (Credit)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Return Calculation Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    Refund Amount:{" "}
                    <strong className="text-slate-900 text-sm font-bold">
                      ₹{(returnQty * selectedInvoice.price).toFixed(2)}
                    </strong>
                    <span className="text-slate-400 ml-1">
                      ({returnQty} × ₹{selectedInvoice.price})
                    </span>
                  </div>

                  <Button
                    onClick={handleProcessReturn}
                    disabled={isSubmitting}
                    className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    Process Return
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Past Returns Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Past Returns History</h2>
            <p className="text-xs text-slate-500">Record of all returned goods, stock adjustments, and credit vouchers</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Filter by return #, bill, item..."
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
            <p className="text-xs font-semibold text-slate-700">No Returns Found</p>
            <p className="text-[11px] text-slate-400">Processed returns will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">Return No</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Customer / Bill</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Returned Item Details</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Reason</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Refund</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Amount</TableHead>
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
                      })}
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-bold text-slate-800 block">
                        {r.invoice.customer?.name || "Walk-in Customer"}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {r.invoice.invoiceNo}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-800">
                      {r.items.map((it) => (
                        <div key={it.id} className="space-y-0.5">
                          <div className="font-semibold text-slate-900">
                            <span>{it.name}</span>{" "}
                            <span className="text-slate-500 font-normal">returned from</span>{" "}
                            <span className="font-mono text-indigo-700 font-bold">{r.invoice.invoiceNo}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Qty: <strong className="text-slate-800">{it.qty} pc</strong> • Price: ₹{it.price.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 capitalize">
                      {r.reason?.replace(/_/g, " ") || "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          r.refundMode === "CREDIT_NOTE" || r.refundMode === "CREDIT"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                      >
                        {r.refundMode === "CREDIT_NOTE" || r.refundMode === "CREDIT"
                          ? "Store Credit"
                          : r.refundMode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      ₹{r.totalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
