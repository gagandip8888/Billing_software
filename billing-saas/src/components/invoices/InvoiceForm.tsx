"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Receipt,
  User,
  Package,
  Sparkles,
  IndianRupee,
  Percent,
  CheckCircle2,
  Printer,
  Loader2,
  Phone,
  Search,
  Building,
  CreditCard,
  Banknote,
  Smartphone,
  Calendar,
  AlertCircle,
  WifiOff,
  Cloud,
} from "lucide-react";

import {
  addPendingInvoice,
  cacheProducts,
  cacheCustomers,
  getCachedProducts,
  getCachedCustomers,
} from "@/lib/offline/db";
import { useNetworkStatus } from "@/hooks/use-network-status";

import { invoiceSchema, InvoiceInput } from "@/lib/validations/invoice";
import { SHOP_TEMPLATES, ProductFieldDefinition } from "@/lib/shop-templates";
import { PaymentMode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PlanLimitModal } from "@/components/subscription/PlanLimitModal";
import { SubscriptionStatus } from "@/lib/subscription";

interface CustomerOption {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  gstNo?: string | null;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
  taxRate: number;
  unit: string;
  stockQty?: number | null;
  category?: string | null;
}

interface InvoiceFormProps {
  initialData?: any;
  shopType?: string;
  initialCustomers?: CustomerOption[];
  initialProducts?: ProductOption[];
  subscription?: SubscriptionStatus;
  onSuccess?: (invoice: any) => void;
}

export function InvoiceForm({
  initialData,
  shopType: propShopType,
  initialCustomers = [],
  initialProducts = [],
  subscription,
  onSuccess,
}: InvoiceFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAndPrint, setSaveAndPrint] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Customer Mode: "walkin" vs "select"
  const [customerMode, setCustomerMode] = useState<"walkin" | "select">(
    initialData?.customerId ? "select" : "walkin"
  );

  // Customer & Product lists state
  const [customers, setCustomers] = useState<CustomerOption[]>(initialCustomers);
  const [products, setProducts] = useState<ProductOption[]>(initialProducts);
  const [productSearch, setProductSearch] = useState("");

  // Resolve shop template
  const shopType =
    propShopType ||
    (session?.user?.shopType as string) ||
    "CUSTOM";
  const template = SHOP_TEMPLATES[shopType] || SHOP_TEMPLATES.CUSTOM;

  const { isOffline, isOnline } = useNetworkStatus();
  const tenantId = (session?.user as any)?.tenantId || "default";

  // Pre-cache or load fallback products and customers
  useEffect(() => {
    if (typeof window === "undefined" || !tenantId) return;

    // 1. If we have products/customers loaded, cache them in IndexedDB for offline use
    if (products.length > 0) {
      cacheProducts(
        tenantId,
        products.map((p) => ({
          id: p.id,
          tenantId,
          name: p.name,
          price: p.price,
          taxRate: p.taxRate,
          unit: p.unit || "PCS",
          stockQty: p.stockQty ?? undefined,
          syncedAt: Date.now(),
        }))
      ).catch(() => {});
    }

    if (customers.length > 0) {
      cacheCustomers(
        tenantId,
        customers.map((c) => ({
          id: c.id,
          tenantId,
          name: c.name,
          mobile: c.mobile,
          syncedAt: Date.now(),
        }))
      ).catch(() => {});
    }

    // 2. If products are empty and we're offline (or network failed), load from IndexedDB
    if (products.length === 0) {
      getCachedProducts(tenantId)
        .then((cached) => {
          if (cached && cached.length > 0) {
            setProducts(
              cached.map((c) => ({
                id: c.id,
                name: c.name,
                price: c.price,
                taxRate: c.taxRate,
                unit: c.unit,
                stockQty: c.stockQty,
              }))
            );
          }
        })
        .catch(() => {});
    }

    // 3. If customers are empty and we're offline, load from IndexedDB
    if (customers.length === 0) {
      getCachedCustomers(tenantId)
        .then((cached) => {
          if (cached && cached.length > 0) {
            setCustomers(
              cached.map((c) => ({
                id: c.id,
                name: c.name,
                mobile: c.mobile,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [products.length, customers.length, tenantId]);

  const defaultItems =
    initialData?.items && initialData.items.length > 0
      ? initialData.items.map((it: any) => ({
          productId: it.productId || undefined,
          name: it.name || "",
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0,
          taxRate: Number(it.taxRate) || 18,
          metadata: it.metadata || {},
        }))
      : [
          {
            productId: undefined,
            name: "",
            qty: 1,
            price: 0,
            taxRate: template.taxEnabled ? template.defaultGstRate : 0,
            metadata: {},
          },
        ];

  const form = useForm<InvoiceInput>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: initialData?.customerId || undefined,
      customerName:
        initialData?.customer?.name ||
        initialData?.metadata?.walkInCustomerName ||
        "",
      customerMobile:
        initialData?.customer?.mobile ||
        initialData?.metadata?.walkInCustomerMobile ||
        "",
      customerAddress: initialData?.customer?.address || "",
      customerGstNo: initialData?.customer?.gstNo || "",
      paymentMode: initialData?.paymentMode || PaymentMode.CASH,
      discountAmount: Number(initialData?.discountAmount || 0),
      amountPaid:
        initialData?.paidAmount !== undefined
          ? Number(initialData.paidAmount)
          : undefined,
      dueDate: initialData?.dueDate
        ? new Date(initialData.dueDate).toISOString().split("T")[0]
        : undefined,
      notes: initialData?.notes || "",
      metadata: initialData?.metadata || {},
      items: defaultItems,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];
  const watchedDiscount = watch("discountAmount") || 0;
  const watchedAmountPaid = watch("amountPaid");
  const metadataValues = watch("metadata") || {};
  const currentPaymentMode = watch("paymentMode");

  // Real-time live totals calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    watchedItems.forEach((item) => {
      const q = Number(item?.qty) || 0;
      const p = Number(item?.price) || 0;
      const r = Number(item?.taxRate) || 0;
      const lineSub = q * p;
      const lineTax = lineSub * (r / 100);
      subtotal += lineSub;
      totalTax += lineTax;
    });

    const discount = Math.min(Number(watchedDiscount) || 0, subtotal + totalTax);
    const grandTotal = Math.max(0, subtotal + totalTax - discount);

    // Paid amount defaults to grand total if not explicitly set
    const paid =
      watchedAmountPaid !== undefined && watchedAmountPaid !== null && watchedAmountPaid !== ("" as any)
        ? Math.min(Number(watchedAmountPaid), grandTotal)
        : grandTotal;
    const balance = Math.max(0, grandTotal - paid);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      cgst: Math.round((totalTax / 2) * 100) / 100,
      sgst: Math.round((totalTax / 2) * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      discountAmount: Math.round(discount * 100) / 100,
      totalAmount: Math.round(grandTotal * 100) / 100,
      paidAmount: Math.round(paid * 100) / 100,
      balanceAmount: Math.round(balance * 100) / 100,
    };
  }, [watchedItems, watchedDiscount, watchedAmountPaid]);

  // When customer is selected from dropdown, populate fields
  function handleSelectCustomer(customerId: string) {
    setValue("customerId", customerId);
    const selected = customers.find((c) => c.id === customerId);
    if (selected) {
      setValue("customerName", selected.name);
      setValue("customerMobile", selected.mobile);
      if (selected.address) setValue("customerAddress", selected.address);
      if (selected.gstNo) setValue("customerGstNo", selected.gstNo);
    }
  }

  // Quick product selection to fill a row
  function handleSelectProduct(index: number, productId: string) {
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      setValue(`items.${index}.productId`, p.id);
      setValue(`items.${index}.name`, p.name);
      setValue(`items.${index}.price`, p.price);
      setValue(`items.${index}.taxRate`, p.taxRate);
    }
  }

  // Add empty row
  function handleAddRow() {
    append({
      productId: undefined,
      name: "",
      qty: 1,
      price: 0,
      taxRate: template.taxEnabled ? template.defaultGstRate : 0,
      metadata: {},
    });
  }

  // Save offline bill into IndexedDB sync queue
  async function saveOfflineBill(payload: any) {
    const pending = await addPendingInvoice({
      tenantId,
      payload,
    });

    // Notify other components & badges
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("billingsaas:pending-added", {
          detail: { id: pending.id },
        })
      );
    }

    const tempInvoiceNo = `OFFLINE-${pending.id.slice(0, 6).toUpperCase()}`;

    toast.success(`⚡ Saved Offline! Bill #${tempInvoiceNo} queued`, {
      description: "Stored in IndexedDB. Will auto-sync to cloud when online.",
      duration: 6000,
    });

    const mockSavedInvoice = {
      id: pending.id,
      invoiceNo: tempInvoiceNo,
      ...payload,
      createdAt: new Date().toISOString(),
      isOffline: true,
    };

    if (onSuccess) {
      onSuccess(mockSavedInvoice);
    } else if (saveAndPrint) {
      window.print();
      router.push("/invoices");
    } else {
      router.push("/invoices");
    }
  }

  async function onSubmit(data: InvoiceInput) {
    setIsSubmitting(true);
    const payload = {
      ...data,
      amountPaid:
        data.amountPaid !== undefined && data.amountPaid !== null
          ? Number(data.amountPaid)
          : totals.totalAmount,
    };

    // If browser is currently offline, save to IndexedDB immediately without network delay
    if (typeof window !== "undefined" && !navigator.onLine) {
      try {
        await saveOfflineBill(payload);
      } catch (err: any) {
        toast.error("Failed to save offline bill: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Attempt online creation; fallback to IndexedDB if network drops mid-request
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        if (result.code === "PLAN_LIMIT_EXCEEDED" || res.status === 403) {
          setShowLimitModal(true);
          toast.error(result.error || "Monthly bill limit reached. Please upgrade your plan.", {
            duration: 6000,
          });
          setIsSubmitting(false);
          return;
        }
        throw new Error(result.error || "Failed to create invoice");
      }

      toast.success(`Invoice #${result.invoice.invoiceNo} created successfully!`);

      if (onSuccess) {
        onSuccess(result.invoice);
      } else if (saveAndPrint) {
        router.push(`/invoices/${result.invoice.id}?print=true`);
      } else {
        router.push(`/invoices/${result.invoice.id}`);
      }
      router.refresh();
    } catch (err: any) {
      // Check for network failure / offline transition
      const isNetworkError =
        !navigator.onLine ||
        err?.name === "TypeError" ||
        err?.message?.includes("fetch") ||
        err?.message?.includes("NetworkError") ||
        err?.message?.includes("Failed to fetch");

      if (isNetworkError) {
        console.warn("Network error during bill creation. Storing in IndexedDB queue:", err);
        try {
          await saveOfflineBill(payload);
          return;
        } catch (offlineErr: any) {
          toast.error("Offline save failed: " + offlineErr.message);
        }
      } else {
        toast.error(err.message || "An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* OFFLINE POS BANNER */}
      {isOffline && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs font-medium animate-in fade-in">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
          <div className="flex-1">
            <span className="font-bold">Offline POS Mode Active:</span> Create bills uninterrupted without internet. Invoices are securely stored in IndexedDB and automatically synced to the server once connection is restored.
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider shrink-0">
            Offline Queue
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ================= LEFT 2 COLUMNS: FORM DETAILS ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION A: CUSTOMER DETAILS */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Customer Details</h3>
                  <p className="text-xs text-slate-500">Walk-in customer or registered regular</p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerMode("walkin");
                    setValue("customerId", undefined);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    customerMode === "walkin"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Walk-in Customer
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("select")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                    customerMode === "select"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Registered Customer
                </button>
              </div>
            </div>

            {/* If Select Mode */}
            {customerMode === "select" && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">
                  Select Existing Customer
                </Label>
                <Select
                  onValueChange={handleSelectCustomer}
                  defaultValue={initialData?.customerId}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Choose a registered customer..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.mobile}) {c.address ? `- ${c.address}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Inputs (Editable for Walk-in or prefilled for Registered) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs font-semibold text-slate-700">
                  Customer Name
                </Label>
                <Input
                  id="customerName"
                  placeholder="e.g. Ramesh Patil / Walk-in"
                  className="h-9 text-xs"
                  {...register("customerName")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerMobile" className="text-xs font-semibold text-slate-700">
                  Mobile Number (for WhatsApp Bill)
                </Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="customerMobile"
                    type="tel"
                    placeholder="10-digit mobile"
                    className="pl-8 h-9 text-xs"
                    {...register("customerMobile")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerAddress" className="text-xs font-semibold text-slate-700">
                  Address / City (Optional)
                </Label>
                <Input
                  id="customerAddress"
                  placeholder="e.g. MG Road, Pune"
                  className="h-9 text-xs"
                  {...register("customerAddress")}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="customerGstNo" className="text-xs font-semibold text-slate-700">
                  Customer GSTIN (B2B Bill)
                </Label>
                <Input
                  id="customerGstNo"
                  placeholder="27ABCDE1234F1Z5"
                  className="h-9 text-xs uppercase"
                  maxLength={15}
                  {...register("customerGstNo")}
                />
              </div>
            </div>
          </div>

          {/* SECTION B: BILLING ITEMS TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Items & Services</h3>
                  <p className="text-xs text-slate-500">Pick from catalog or type custom items</p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-8 text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
            </div>

            {/* Line Items Container */}
            <div className="space-y-3">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-1">
                <div className="col-span-5">Item / Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Rate (₹)</div>
                <div className="col-span-1 text-right">GST %</div>
                <div className="col-span-2 text-right">Amount</div>
              </div>

              {fields.map((field, index) => {
                const itemQty = Number(watchedItems[index]?.qty) || 0;
                const itemPrice = Number(watchedItems[index]?.price) || 0;
                const itemTaxRate = Number(watchedItems[index]?.taxRate) || 0;
                const lineTotal = itemQty * itemPrice * (1 + itemTaxRate / 100);

                return (
                  <div
                    key={field.id}
                    className="p-3 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-slate-100 bg-slate-50/50 sm:bg-transparent space-y-2 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 items-center"
                  >
                    {/* Item Name & Catalog Picker */}
                    <div className="col-span-5 space-y-1">
                      <div className="flex gap-1.5">
                        <Input
                          placeholder="Item name / Service"
                          className="h-9 text-xs"
                          {...register(`items.${index}.name`)}
                        />
                        {products.length > 0 && (
                          <Select
                            onValueChange={(val) => handleSelectProduct(index, val)}
                          >
                            <SelectTrigger className="h-9 w-20 px-2 text-[10px] bg-slate-50 text-slate-600">
                              <SelectValue placeholder="Catalog" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                              {products.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name} - ₹{p.price} ({p.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      {errors.items?.[index]?.name && (
                        <p className="text-[10px] text-red-500">
                          {errors.items[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    {/* Qty */}
                    <div className="col-span-2 flex sm:block items-center justify-between">
                      <span className="sm:hidden text-xs text-slate-500">Qty:</span>
                      <Input
                        type="number"
                        step="any"
                        placeholder="1"
                        className="h-9 text-xs text-right w-24 sm:w-full ml-auto"
                        {...register(`items.${index}.qty`)}
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-2 flex sm:block items-center justify-between">
                      <span className="sm:hidden text-xs text-slate-500">Rate:</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-9 text-xs text-right w-28 sm:w-full ml-auto"
                        {...register(`items.${index}.price`)}
                      />
                    </div>

                    {/* Tax Rate */}
                    <div className="col-span-1 flex sm:block items-center justify-between">
                      <span className="sm:hidden text-xs text-slate-500">GST %:</span>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="18"
                        className="h-9 text-xs text-right w-20 sm:w-full ml-auto"
                        {...register(`items.${index}.taxRate`)}
                      />
                    </div>

                    {/* Line Total & Remove */}
                    <div className="col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0">
                      <span className="sm:hidden text-xs font-bold text-slate-700">Total:</span>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        ₹{lineTotal.toFixed(2)}
                      </span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="h-7 w-7 text-slate-400 hover:text-red-600 flex items-center justify-center transition rounded"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {errors.items?.root && (
              <p className="text-xs text-red-500">{errors.items.root.message}</p>
            )}
          </div>

          {/* SECTION C: DYNAMIC SHOP-SPECIFIC INVOICE FIELDS */}
          {template.invoiceFields && template.invoiceFields.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 rounded-xl border border-blue-200/70 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {template.name} Special Fields
                    </h3>
                    <p className="text-xs text-slate-500">
                      Attributes customized for your shop type saved to invoice metadata
                    </p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs font-medium">
                  {template.id}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {template.invoiceFields.map((fieldDef: ProductFieldDefinition) => {
                  const currentValue = metadataValues?.[fieldDef.name] ?? "";

                  return (
                    <div key={fieldDef.name} className="space-y-1.5">
                      <Label
                        htmlFor={`inv-dynamic-${fieldDef.name}`}
                        className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                      >
                        {fieldDef.label}
                        {fieldDef.required && <span className="text-red-500">*</span>}
                      </Label>

                      {fieldDef.type === "select" && fieldDef.options ? (
                        <Select
                          value={currentValue ? String(currentValue) : ""}
                          onValueChange={(val) => {
                            setValue(`metadata.${fieldDef.name}`, val, {
                              shouldDirty: true,
                            });
                          }}
                        >
                          <SelectTrigger
                            id={`inv-dynamic-${fieldDef.name}`}
                            className="h-9 text-xs bg-white"
                          >
                            <SelectValue
                              placeholder={
                                fieldDef.placeholder || `Select ${fieldDef.label}`
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldDef.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : fieldDef.type === "date" ? (
                        <Input
                          id={`inv-dynamic-${fieldDef.name}`}
                          type="date"
                          className="h-9 text-xs bg-white"
                          value={currentValue}
                          onChange={(e) => {
                            setValue(`metadata.${fieldDef.name}`, e.target.value, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      ) : fieldDef.type === "number" ? (
                        <Input
                          id={`inv-dynamic-${fieldDef.name}`}
                          type="number"
                          step="any"
                          placeholder={fieldDef.placeholder || "0"}
                          className="h-9 text-xs bg-white"
                          value={currentValue}
                          onChange={(e) => {
                            const val =
                              e.target.value === "" ? undefined : Number(e.target.value);
                            setValue(`metadata.${fieldDef.name}`, val, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      ) : (
                        <Input
                          id={`inv-dynamic-${fieldDef.name}`}
                          type="text"
                          placeholder={
                            fieldDef.placeholder ||
                            `Enter ${fieldDef.label.toLowerCase()}`
                          }
                          className="h-9 text-xs bg-white"
                          value={currentValue}
                          onChange={(e) => {
                            setValue(`metadata.${fieldDef.name}`, e.target.value, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION D: PAYMENT & NOTES */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Payment & Settlement</h3>
                <p className="text-xs text-slate-500">Select payment channel and enter amount received</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-700">
                Payment Mode <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="paymentMode"
                render={({ field }) => (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { mode: PaymentMode.CASH, label: "Cash", icon: Banknote },
                      { mode: PaymentMode.UPI, label: "UPI / QR", icon: Smartphone },
                      { mode: PaymentMode.CARD, label: "Card / POS", icon: CreditCard },
                      { mode: PaymentMode.CREDIT, label: "Khata / Credit", icon: User },
                      { mode: PaymentMode.BANK_TRANSFER, label: "Bank Transfer", icon: Building },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = field.value === item.mode;
                      return (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => field.onChange(item.mode)}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition ${
                            isSelected
                              ? "border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm"
                              : "border-slate-200 hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <Icon className={`h-4 w-4 mb-1.5 ${isSelected ? "text-blue-600" : "text-slate-500"}`} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="discountAmount" className="text-xs font-semibold text-slate-700">
                  Discount (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">₹</span>
                  <Input
                    id="discountAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-7 h-9 text-xs"
                    {...register("discountAmount")}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amountPaid" className="text-xs font-semibold text-slate-700">
                  Amount Received (₹)
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-semibold">₹</span>
                  <Input
                    id="amountPaid"
                    type="number"
                    step="0.01"
                    placeholder={totals.totalAmount.toFixed(2)}
                    className="pl-7 h-9 text-xs font-semibold text-emerald-700"
                    {...register("amountPaid")}
                  />
                </div>
                <span className="text-[10px] text-slate-400">Default: Full amount (₹{totals.totalAmount})</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dueDate" className="text-xs font-semibold text-slate-700">
                  Due Date (for Credit/Khata)
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  className="h-9 text-xs"
                  {...register("dueDate")}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                Invoice Notes / Terms (Visible on Bill)
              </Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="e.g. 50% advance received, balance on delivery. Non-refundable."
                className="text-xs resize-none"
                {...register("notes")}
              />
            </div>
          </div>
        </div>

        {/* ================= RIGHT 1 COLUMN: STICKY BILL TOTALS & ACTIONS ================= */}
        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Bill Summary</span>
              <span className="text-xs font-normal text-slate-500 font-mono">
                {watchedItems.length} {watchedItems.length === 1 ? "item" : "items"}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Total GST:</span>
                <span className="font-semibold text-slate-900">₹{totals.taxAmount.toFixed(2)}</span>
              </div>

              {totals.taxAmount > 0 && (
                <div className="pl-2 border-l-2 border-slate-100 space-y-1 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>CGST:</span>
                    <span>₹{totals.cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST:</span>
                    <span>₹{totals.sgst.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount:</span>
                  <span>- ₹{totals.discountAmount.toFixed(2)}</span>
                </div>
              )}

              <Separator className="my-2" />

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  ₹{totals.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold pt-2 border-t border-slate-100">
                <span>Amount Paid:</span>
                <span>₹{totals.paidAmount.toFixed(2)}</span>
              </div>

              {totals.balanceAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{totals.balanceAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator className="my-3" />

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => setSaveAndPrint(true)}
                className={`w-full h-10 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 ${
                  isOffline
                    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20"
                    : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                }`}
              >
                {isSubmitting && saveAndPrint ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {isOffline ? "Saving Locally..." : "Generating Bill..."}
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" /> {isOffline ? "⚡ Save & Print (Offline)" : "Save & Print Bill"}
                  </>
                )}
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                variant="outline"
                onClick={() => setSaveAndPrint(false)}
                className="w-full h-10 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting && !saveAndPrint ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-slate-500" /> {isOffline ? "⚡ Save Offline Queue" : "Save Invoice Only"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Plan limit exceeded modal dialog */}
      <PlanLimitModal
        open={showLimitModal}
        onOpenChange={setShowLimitModal}
        currentPlan={subscription?.plan || "FREE"}
        billLimit={subscription?.usage?.billLimit || 50}
        billsThisMonth={subscription?.usage?.billsThisMonth || 50}
      />
    </form>
  );
}
