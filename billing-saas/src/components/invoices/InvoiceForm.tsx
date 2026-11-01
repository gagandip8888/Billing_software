"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import {
  Plus,
  Trash2,
  Receipt,
  User,
  Package,
  Sparkles,
  IndianRupee,
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
  PauseCircle,
  MapPin,
  ExternalLink,
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
import { PaymentMode } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/language-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PlanLimitModal } from "@/components/subscription/PlanLimitModal";
import { SubscriptionStatus } from "@/lib/subscription";
import { HoldBillDialog } from "@/components/invoices/HoldBillDialog";

export interface CustomerOption {
  id: string;
  name: string;
  mobile: string;
  email?: string | null;
  address?: string | null;
  gstNo?: string | null;
}

export interface ProductOption {
  id: string;
  productId?: string | null;
  name: string;
  price: number;
  taxRate: number;
  unit: string;
  stockQty?: number | null;
  category?: string | null;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
  mrp?: number | null;
  barcode?: string | null;
}

interface InvoiceFormProps {
  initialData?: any;
  shopType?: string;
  initialCustomers?: CustomerOption[];
  initialProducts?: ProductOption[];
  subscription?: SubscriptionStatus;
  shopInfo?: {
    shopName: string;
    upiId?: string | null;
  };
  onSuccess?: (invoice: any) => void;
}

export function InvoiceForm({
  initialData,
  shopType: propShopType,
  initialCustomers = [],
  initialProducts = [],
  subscription,
  shopInfo,
  onSuccess,
}: InvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeHoldId = searchParams?.get("resumeHoldId");
  const { data: session } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAndPrint, setSaveAndPrint] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Hold Bill State
  const [heldBillId, setHeldBillId] = useState<string | null>(resumeHoldId || null);
  const [isHoldDialogOpen, setIsHoldDialogOpen] = useState(false);

  // Customer & Product lists state
  const [customers, setCustomers] = useState<CustomerOption[]>(initialCustomers);
  const [products, setProducts] = useState<ProductOption[]>(initialProducts);

  // Payment Toggle State: "PAID" vs "UDHARI"
  const [paymentType, setPaymentType] = useState<"PAID" | "UDHARI">(
    initialData?.paymentMode === PaymentMode.CREDIT ? "UDHARI" : "PAID"
  );
  // Paid Sub-Mode: "CASH" | "UPI" | "CARD"
  const [paidSubMode, setPaidSubMode] = useState<"CASH" | "UPI" | "CARD">(
    initialData?.paymentMode === PaymentMode.UPI
      ? "UPI"
      : initialData?.paymentMode === PaymentMode.CARD
      ? "CARD"
      : "CASH"
  );

  // Ref tracking for keyboard navigation (Enter key on Product ID & Qty fields)
  const productIdInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const qtyInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Searchable dropdown state for Product ID / Name search
  const [activeDropdownIndex, setActiveDropdownIndex] = useState<number | null>(null);

  const { isOffline } = useNetworkStatus();
  const { t } = useLanguage();
  const tenantId = (session?.user as any)?.tenantId || "default";

  // Shop details for UPI and WhatsApp
  const shopName =
    shopInfo?.shopName ||
    (session?.user as any)?.businessName ||
    (session?.user as any)?.name ||
    "Retail Store";
  const [dynamicUpiId, setDynamicUpiId] = useState<string>(shopInfo?.upiId || "");

  useEffect(() => {
    if (!shopInfo?.upiId) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data?.setting?.upiId) {
            setDynamicUpiId(data.setting.upiId);
          }
        })
        .catch(() => {});
    } else {
      setDynamicUpiId(shopInfo.upiId);
    }
  }, [shopInfo?.upiId]);

  // Cache products / customers for offline support
  useEffect(() => {
    if (typeof window === "undefined" || !tenantId) return;

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

  // Default initial items
  const defaultItems =
    initialData?.items && initialData.items.length > 0
      ? initialData.items.map((it: any) => ({
          productId: it.productId || undefined,
          name: it.name || "",
          qty: Number(it.qty) || 1,
          price: Number(it.price) || 0,
          taxRate: Number(it.taxRate) || 0,
          itemDiscount: Number(it.itemDiscount) || 0,
          discountType: "amount" as const,
        }))
      : [
          {
            productId: undefined,
            name: "",
            qty: 1,
            price: 0,
            taxRate: 0,
            itemDiscount: 0,
            discountType: "amount" as const,
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
      paymentMode:
        paymentType === "UDHARI"
          ? PaymentMode.CREDIT
          : paidSubMode === "UPI"
          ? PaymentMode.UPI
          : paidSubMode === "CARD"
          ? PaymentMode.CARD
          : PaymentMode.CASH,
      discountAmount: Number(initialData?.discountAmount || 0),
      amountPaid:
        initialData?.paidAmount !== undefined
          ? Number(initialData.paidAmount)
          : undefined,
      items: defaultItems,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items") || [];
  const watchedDiscount = watch("discountAmount") || 0;
  const watchedCustomerName = watch("customerName") || "";
  const watchedCustomerMobile = watch("customerMobile") || "";

  // Synchronize paymentMode in form state when toggle changes
  useEffect(() => {
    if (paymentType === "UDHARI") {
      setValue("paymentMode", PaymentMode.CREDIT);
      setValue("amountPaid", 0);
    } else {
      const mode =
        paidSubMode === "UPI"
          ? PaymentMode.UPI
          : paidSubMode === "CARD"
          ? PaymentMode.CARD
          : PaymentMode.CASH;
      setValue("paymentMode", mode);
    }
  }, [paymentType, paidSubMode, setValue]);

  // Load Held Bill if resumeHoldId is in query params
  useEffect(() => {
    if (!resumeHoldId) return;
    async function loadHeldBill() {
      try {
        const res = await fetch(`/api/hold-bills/${resumeHoldId}`);
        const data = await res.json();
        if (res.ok && data.holdBill) {
          const p = data.holdBill.payload || {};
          if (p.customerId) setValue("customerId", p.customerId);
          if (p.customerName) setValue("customerName", p.customerName);
          if (p.customerMobile) setValue("customerMobile", p.customerMobile);
          if (p.customerAddress) setValue("customerAddress", p.customerAddress);
          if (p.discountAmount) setValue("discountAmount", Number(p.discountAmount));
          if (p.items && Array.isArray(p.items) && p.items.length > 0) {
            setValue("items", p.items);
          }
          setHeldBillId(data.holdBill.id);
          toast.success(`Resumed held bill for ${data.holdBill.customerName || "Customer"}`);
        }
      } catch (err) {
        console.warn("Could not load held bill:", err);
      }
    }
    loadHeldBill();
  }, [resumeHoldId, setValue]);

  // Live real-time totals calculation
  const totals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;

    watchedItems.forEach((item) => {
      const q = Number(item?.qty) || 0;
      const p = Number(item?.price) || 0;
      const r = Number(item?.taxRate) || 0;
      const lineBase = q * p;
      const lineTax = lineBase * (r / 100);
      subtotal += lineBase;
      totalTax += lineTax;
    });

    const billDiscount = Math.min(Number(watchedDiscount) || 0, subtotal + totalTax);
    const grandTotal = Math.max(0, subtotal + totalTax - billDiscount);

    const paid = paymentType === "UDHARI" ? 0 : grandTotal;
    const balance = paymentType === "UDHARI" ? grandTotal : 0;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      discountAmount: Math.round(billDiscount * 100) / 100,
      totalAmount: Math.round(grandTotal * 100) / 100,
      paidAmount: Math.round(paid * 100) / 100,
      balanceAmount: Math.round(balance * 100) / 100,
    };
  }, [watchedItems, watchedDiscount, paymentType]);

  // Filter matching products for searchable dropdown (matches Product ID or Name)
  function getMatchingProducts(enteredValue: string) {
    const q = (enteredValue || "").trim().toLowerCase();
    if (!q) {
      return products.slice(0, 8); // show popular/first 8 items when field is empty
    }
    return products
      .filter((p) => {
        const idMatch = p.productId?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q);
        const nameMatch = p.name?.toLowerCase().includes(q);
        const barcodeMatch = p.barcode?.toLowerCase().includes(q);
        return idMatch || nameMatch || barcodeMatch;
      })
      .slice(0, 10);
  }

  // Handle product selection from searchable dropdown list
  function handleSelectProduct(index: number, prod: any) {
    // Populate Item Name and Price, and set user-facing Product ID
    setValue(`items.${index}.productId`, prod.productId || prod.id, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${index}.name`, prod.name, { shouldValidate: true, shouldDirty: true });
    setValue(`items.${index}.price`, Number(prod.price), { shouldValidate: true, shouldDirty: true });
    setValue(`items.${index}.taxRate`, Number(prod.taxRate || 0), { shouldValidate: true, shouldDirty: true });
    if (prod.size) setValue(`items.${index}.size`, prod.size);
    if (prod.color) setValue(`items.${index}.color`, prod.color);
    if (prod.brand) setValue(`items.${index}.brand`, prod.brand);
    if (prod.mrp) setValue(`items.${index}.mrp`, Number(prod.mrp));

    setActiveDropdownIndex(null);

    // Automatically focus the Qty field once product is selected
    setTimeout(() => {
      qtyInputRefs.current[index]?.focus();
      qtyInputRefs.current[index]?.select();
    }, 50);
  }

  // Quick lookup to fill item when user types Product ID
  function handleProductIdInput(index: number, enteredValue: string) {
    const q = enteredValue.trim();
    if (!q) return;

    // Search by productId first, then barcode or id or name
    const found = products.find(
      (prod) =>
        prod.productId?.toLowerCase() === q.toLowerCase() ||
        prod.barcode?.toLowerCase() === q.toLowerCase() ||
        prod.id.toLowerCase() === q.toLowerCase() ||
        prod.name.toLowerCase() === q.toLowerCase()
    );

    if (found) {
      handleSelectProduct(index, found);
    } else {
      // Async fallback to search API if product was not in initial 500 loaded items
      fetch(`/api/products?search=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.products) && data.products.length > 0) {
            const match =
              data.products.find(
                (p: any) =>
                  p.productId?.toLowerCase() === q.toLowerCase() ||
                  p.barcode?.toLowerCase() === q.toLowerCase() ||
                  p.name?.toLowerCase() === q.toLowerCase()
              ) || data.products[0];

            if (match) {
              handleSelectProduct(index, match);
            }
          }
        })
        .catch(() => {});
    }
  }

  // Keydown handler on Product ID field: Pressing Enter selects first matching product or moves focus to Qty
  function handleProductIdKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = (e.target as HTMLInputElement).value;
      const matches = getMatchingProducts(val);
      if (matches.length > 0) {
        handleSelectProduct(index, matches[0]);
      } else {
        handleProductIdInput(index, val);
        setActiveDropdownIndex(null);
        setTimeout(() => {
          qtyInputRefs.current[index]?.focus();
          qtyInputRefs.current[index]?.select();
        }, 50);
      }
    } else if (e.key === "Escape") {
      setActiveDropdownIndex(null);
    }
  }

  // Add new item row
  function handleAddRow() {
    append({
      productId: undefined,
      name: "",
      qty: 1,
      price: 0,
      taxRate: 0,
      itemDiscount: 0,
      discountType: "amount",
    });

    setTimeout(() => {
      const nextIndex = fields.length;
      productIdInputRefs.current[nextIndex]?.focus();
    }, 60);
  }

  // Keydown handler in Qty field: Pressing Enter appends row and moves focus
  function handleQtyKeyDown(e: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddRow();
    }
  }

  // Select customer from registered list
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

  // Offline save handler
  async function saveOfflineBill(payload: any) {
    const pending = await addPendingInvoice({
      tenantId,
      payload,
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("billingsaas:pending-added", {
          detail: { id: pending.id },
        })
      );
    }

    const tempInvoiceNo = `OFFLINE-${pending.id.slice(0, 6).toUpperCase()}`;
    toast.success(`⚡ Saved Offline! Bill #${tempInvoiceNo} queued`, {
      description: "Stored in IndexedDB. Will auto-sync when online.",
      duration: 6000,
    });

    const mockSavedInvoice = {
      id: pending.id,
      invoiceNo: tempInvoiceNo,
      ...payload,
      createdAt: new Date().toISOString(),
      isOffline: true,
    };

    if (heldBillId) {
      fetch(`/api/hold-bills/${heldBillId}`, { method: "DELETE" }).catch(() => {});
    }

    if (onSuccess) {
      onSuccess(mockSavedInvoice);
    } else if (saveAndPrint) {
      window.print();
      router.push("/invoices");
    } else {
      router.push("/invoices");
    }
  }

  // Form submit handler
  async function onSubmit(data: InvoiceInput) {
    // 1. Mandatory Customer Name and Mobile Validation
    const customerNameTrim = (data.customerName || "").trim();
    const customerMobileTrim = (data.customerMobile || "").trim();
    const mobileDigits = customerMobileTrim.replace(/\D/g, "");

    if (!customerNameTrim) {
      toast.error("Customer Name is mandatory (*)");
      return;
    }

    if (!customerMobileTrim || mobileDigits.length < 10) {
      toast.error("Customer Mobile (at least 10 digits) is mandatory (*)");
      return;
    }

    // 2. Validate at least 1 valid item
    const validItems = (data.items || []).filter(
      (item) => item.name?.trim() && Number(item.qty) > 0
    );

    if (validItems.length === 0) {
      toast.error("Please add at least 1 item with a valid Product ID and Qty.");
      return;
    }

    setIsSubmitting(true);

    const isCredit = paymentType === "UDHARI";
    const amountPaidFinal = isCredit ? 0 : totals.totalAmount;
    const finalPaymentMode = isCredit
      ? PaymentMode.CREDIT
      : paidSubMode === "UPI"
      ? PaymentMode.UPI
      : paidSubMode === "CARD"
      ? PaymentMode.CARD
      : PaymentMode.CASH;

    const paymentsFinal = isCredit
      ? []
      : [
          {
            mode: finalPaymentMode,
            amount: amountPaidFinal,
          },
        ];

    const payload = {
      ...data,
      customerName: customerNameTrim,
      customerMobile: customerMobileTrim,
      paymentMode: finalPaymentMode,
      amountPaid: amountPaidFinal,
      payments: paymentsFinal,
      items: validItems,
    };

    // Auto-WhatsApp URL format (with PDF attached notice)
    const totalFormatted = totals.totalAmount.toFixed(2);
    const mobileClean = mobileDigits.slice(-10);
    const whatsappText = `Hi ${customerNameTrim}, here is your bill for ₹${totalFormatted}. Please find the PDF attached.`;
    const whatsappUrl = `https://wa.me/91${mobileClean}?text=${encodeURIComponent(whatsappText)}`;

    // Offline POS fallback
    if (typeof window !== "undefined" && !navigator.onLine) {
      try {
        await saveOfflineBill(payload);
        toast.success("Bill saved offline. Please share the PDF on WhatsApp.");
      } catch (err: any) {
        toast.error("Failed to save offline bill: " + err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

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

      // If resuming a held bill, delete from held queue
      if (heldBillId) {
        fetch(`/api/hold-bills/${heldBillId}`, { method: "DELETE" }).catch(() => {});
      }

      // Notify TopNavbar and Dashboard of inventory stock update & bill creation
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
        window.dispatchEvent(new CustomEvent("billingsaas:bill-saved"));
      }

      // Show success toast with WhatsApp instruction (NO auto-redirect to WhatsApp)
      toast.success("Bill saved. Please share the PDF on WhatsApp.");

      // Always open the Invoice Print / View page so the owner can see the bill
      if (saveAndPrint) {
        router.push(`/invoices/${result.invoice.id}?print=true`);
      } else {
        router.push(`/invoices/${result.invoice.id}`);
      }

      router.refresh();
      if (onSuccess) onSuccess(result.invoice);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Live UPI QR code URL string using dynamic UPI ID
  const upiQrString = dynamicUpiId
    ? `upi://pay?pa=${encodeURIComponent(dynamicUpiId)}&pn=${encodeURIComponent(
        shopName
      )}&am=${encodeURIComponent(totals.totalAmount.toFixed(2))}&cu=INR`
    : "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* OFFLINE POS BANNER */}
      {isOffline && (
        <div className="flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-700 text-xs font-medium">
          <WifiOff className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
          <div className="flex-1">
            <span className="font-bold">Offline Terminal Mode:</span> Create bills uninterrupted without internet. They will sync automatically when back online.
          </div>
        </div>
      )}

      {/* Main Grid: Left Details & Right Bill Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ================= LEFT 2 COLUMNS: FORM DETAILS ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* TASK 1: CUSTOMER DETAILS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t("customerDetails", "Customer Details")}</h3>
                  <p className="text-xs text-slate-500">Name and Mobile are mandatory for bill & WhatsApp</p>
                </div>
              </div>

              {customers.length > 0 && (
                <div className="w-56">
                  <Select onValueChange={handleSelectCustomer}>
                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select regular customer..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.mobile})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Customer Name - Mandatory */}
              <div className="space-y-1.5">
                <Label htmlFor="customerName" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  {t("customerName", "Customer Name")} <span className="text-red-500 font-bold">*</span>
                </Label>
                <Input
                  id="customerName"
                  placeholder="e.g. Ramesh Patil"
                  className={`h-9 text-xs ${
                    errors.customerName ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                  {...register("customerName")}
                />
                {errors.customerName && (
                  <p className="text-[11px] text-red-500">{errors.customerName.message}</p>
                )}
              </div>

              {/* Mobile Number - Mandatory */}
              <div className="space-y-1.5">
                <Label htmlFor="customerMobile" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  {t("customerMobile", "Mobile Number")} <span className="text-red-500 font-bold">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                  <Input
                    id="customerMobile"
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    className={`pl-10 h-9 text-xs font-mono ${
                      errors.customerMobile ? "border-red-500 focus-visible:ring-red-500" : ""
                    }`}
                    {...register("customerMobile")}
                  />
                </div>
                {errors.customerMobile && (
                  <p className="text-[11px] text-red-500">{errors.customerMobile.message}</p>
                )}
              </div>

              {/* Address - Optional */}
              <div className="space-y-1.5">
                <Label htmlFor="customerAddress" className="text-xs font-semibold text-slate-700">
                  {t("customerAddress", "Address (Optional)")}
                </Label>
                <Input
                  id="customerAddress"
                  placeholder="e.g. MG Road, Pune"
                  className="h-9 text-xs"
                  {...register("customerAddress")}
                />
              </div>
            </div>
          </div>

          {/* TASK 1: BILLING ITEMS (Product ID & Qty only, auto-fills rest) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t("itemsAndProducts", "Items & Products")}</h3>
                  <p className="text-xs text-slate-500">
                    Type or search <strong>Product ID / Name</strong> &rarr; select from dropdown &rarr; enter <strong>Qty</strong>
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="h-8 text-xs font-semibold border-purple-200 text-purple-700 hover:bg-purple-50 flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> {t("addRow", "Add Row")}
              </Button>
            </div>

            {/* Items Table */}
            <div className="space-y-2.5">
              <div className="hidden sm:grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-500 uppercase px-1">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">Search Product (ID / Name)</div>
                <div className="col-span-3">Item Name (Read-only)</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-right">Price (₹) [Read-only]</div>
                <div className="col-span-2 text-right">Total (₹)</div>
              </div>

              {fields.map((field, index) => {
                const itemQty = Number(watchedItems[index]?.qty) || 0;
                const itemPrice = Number(watchedItems[index]?.price) || 0;
                const itemName = watchedItems[index]?.name || "";
                const lineTotal = itemQty * itemPrice;

                const { ref: formQtyRef, ...qtyProps } = register(`items.${index}.qty`, {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setValue(`items.${index}.qty`, val, { shouldValidate: true, shouldDirty: true });
                  },
                });

                return (
                  <div
                    key={field.id}
                    className="p-3.5 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-slate-200 bg-white sm:bg-transparent shadow-xs sm:shadow-none space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-center"
                  >
                    {/* Mobile Header: Item Number & Remove button */}
                    <div className="flex sm:hidden items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-800">Item #{index + 1}</span>
                      {fields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    {/* Desktop Index */}
                    <div className="hidden sm:flex col-span-1 items-center justify-center text-xs font-bold text-slate-400">
                      {index + 1}
                    </div>

                    {/* 1. Searchable Product ID / Name Input with Dropdown */}
                    <div className="sm:col-span-3">
                      <label className="sm:hidden text-[11px] font-semibold text-slate-600 block mb-1">
                        Product ID / Name
                      </label>
                      <div className="relative">
                        <Input
                          ref={(el) => {
                            productIdInputRefs.current[index] = el;
                          }}
                          placeholder="Search ID or Name (e.g. 1023, T-shirt)"
                          value={watchedItems[index]?.productId || ""}
                          onFocus={() => {
                            setActiveDropdownIndex(index);
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setValue(`items.${index}.productId`, val, { shouldDirty: true });
                            setActiveDropdownIndex(index);
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setActiveDropdownIndex((curr) => (curr === index ? null : curr));
                            }, 200);
                          }}
                          onKeyDown={(e) => handleProductIdKeyDown(e, index)}
                          className="h-9 text-xs font-mono font-semibold bg-white border-slate-300 focus-visible:ring-purple-500 w-full pr-7"
                        />
                        <Search className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />

                        {/* Searchable Dropdown List */}
                        {activeDropdownIndex === index && (() => {
                          const query = watchedItems[index]?.productId || "";
                          const matches = getMatchingProducts(query);
                          if (matches.length === 0) return null;

                          return (
                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                              <div className="px-2.5 py-1.5 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                                <span>Matching Products ({matches.length})</span>
                                <span className="text-[9px] font-normal lowercase">Click or press Enter</span>
                              </div>
                              {matches.map((prod) => (
                                <div
                                  key={prod.id}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleSelectProduct(index, prod);
                                  }}
                                  className="px-3 py-2 text-xs hover:bg-purple-50 hover:text-purple-900 cursor-pointer flex items-center justify-between transition group"
                                >
                                  <div className="min-w-0 pr-2">
                                    <span className="font-semibold text-slate-800 group-hover:text-purple-900 block truncate">
                                      {prod.name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-mono">
                                      ID: {prod.productId || prod.id}
                                    </span>
                                    {prod.stockQty !== null && prod.stockQty !== undefined && (
                                      <span className="text-[10px] text-slate-400 ml-2">
                                        • {prod.stockQty} in stock
                                      </span>
                                    )}
                                  </div>
                                  <span className="shrink-0 font-mono font-bold text-slate-900 group-hover:text-purple-700 bg-slate-100 group-hover:bg-purple-100 px-2 py-0.5 rounded text-[11px]">
                                    ₹{Number(prod.price).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* 2. Item Name (Read-only / Disabled once populated) */}
                    <div className="sm:col-span-3">
                      <label className="sm:hidden text-[11px] font-semibold text-slate-600 block mb-1">
                        Item Name (Read-only)
                      </label>
                      <Input
                        readOnly
                        disabled
                        value={itemName}
                        placeholder="Auto-fills from Product ID"
                        className="h-9 text-xs bg-slate-100 text-slate-700 font-medium border-slate-200 cursor-not-allowed w-full truncate select-none opacity-90"
                        title={itemName}
                      />
                    </div>

                    {/* Mobile Subgrid: Qty, Price, Total */}
                    <div className="grid grid-cols-3 gap-2 sm:contents">
                      {/* 3. Qty (Enter key adds new row) */}
                      <div className="sm:col-span-1">
                        <label className="sm:hidden text-[11px] font-semibold text-slate-600 block mb-1">
                          Qty
                        </label>
                        <Input
                          {...qtyProps}
                          ref={(el) => {
                            formQtyRef(el);
                            qtyInputRefs.current[index] = el;
                          }}
                          type="number"
                          min="1"
                          step="any"
                          placeholder="1"
                          onKeyDown={(e) => handleQtyKeyDown(e, index)}
                          className="h-9 text-xs text-center font-bold bg-white border-slate-300 w-full focus-visible:ring-purple-500"
                        />
                      </div>

                      {/* 4. Price (Read-only / Disabled once product is selected) */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden text-[11px] font-semibold text-slate-600 block mb-1">
                          Price (₹) [Read-only]
                        </label>
                        <Input
                          type="number"
                          readOnly
                          disabled
                          value={itemPrice !== 0 ? itemPrice : (watchedItems[index]?.price || "")}
                          placeholder="0.00"
                          className="h-9 text-xs text-right font-mono font-bold bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed w-full select-none opacity-90"
                        />
                      </div>

                      {/* 5. Total (Auto-calculated live: Qty × Price) */}
                      <div className="sm:col-span-2">
                        <label className="sm:hidden text-[11px] font-semibold text-slate-600 block mb-1">
                          Total (₹)
                        </label>
                        <div className="h-9 flex items-center justify-between sm:justify-end gap-2 px-2.5 sm:px-0 bg-purple-50 sm:bg-transparent rounded-md border sm:border-none border-purple-100">
                          <span className="text-xs font-bold font-mono text-purple-900">
                            ₹{lineTotal.toFixed(2)}
                          </span>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="hidden sm:flex h-7 w-7 text-slate-400 hover:text-red-600 items-center justify-center transition rounded-lg hover:bg-red-50"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Add Row Button below list */}
            <div className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddRow}
                className="text-xs font-semibold text-purple-700 hover:bg-purple-50 hover:text-purple-800 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> + Add Row
              </Button>
            </div>
          </div>

          {/* TASK 2: PAYMENT SECTION (Paid vs Udhari Toggle & Auto-QR) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{t("paymentMethod", "Payment Method")}</h3>
                  <p className="text-xs text-slate-500">{t("selectPaymentNotice", "Select Paid (Cash / UPI / Card) or Udhari (Credit)")}</p>
                </div>
              </div>
            </div>

            {/* Big Segmented Toggle: Paid vs Udhari */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPaymentType("PAID")}
                className={`py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  paymentType === "PAID"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Banknote className="h-4 w-4" /> {t("paidOption", "Paid (Cash / UPI / Card)")}
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("UDHARI")}
                className={`py-2.5 px-4 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                  paymentType === "UDHARI"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <IndianRupee className="h-4 w-4" /> {t("udhariOption", "Udhari (Credit)")}
              </button>
            </div>

            {/* If "PAID" is selected: show Cash, UPI, Card buttons */}
            {paymentType === "PAID" && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { mode: "CASH" as const, label: "Cash", icon: Banknote },
                    { mode: "UPI" as const, label: "UPI (Auto QR)", icon: Smartphone },
                    { mode: "CARD" as const, label: "Card / POS", icon: CreditCard },
                  ].map((sub) => {
                    const Icon = sub.icon;
                    const isSelected = paidSubMode === sub.mode;
                    return (
                      <button
                        key={sub.mode}
                        id={`payment-mode-${sub.mode.toLowerCase()}`}
                        type="button"
                        onClick={() => {
                          setPaidSubMode(sub.mode);
                          if (sub.mode === "UPI" && !dynamicUpiId) {
                            toast.warning("Please set your UPI ID in Settings to enable instant QR codes", {
                              action: {
                                label: "Settings",
                                onClick: () => router.push("/settings?tab=payment"),
                              },
                            });
                          }
                        }}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/70 text-purple-700 ring-1 ring-purple-600 shadow-sm font-bold"
                            : "border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isSelected ? "text-purple-600" : "text-slate-400"}`} />
                        <span className="text-xs">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* AUTO-GENERATED UPI QR CODE */}
                {paidSubMode === "UPI" && (
                  !dynamicUpiId ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                        <div>
                          <strong className="block text-amber-900 font-semibold">No UPI ID Configured</strong>
                          <span>Please set your store UPI ID in Settings to generate customer QR codes.</span>
                        </div>
                      </div>
                      <Link
                        href="/settings?tab=payment"
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shrink-0 transition"
                      >
                        Set UPI ID &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-indigo-50 border border-purple-200 flex flex-col sm:flex-row items-center gap-5">
                      <div className="p-3 bg-white rounded-xl shadow-sm border border-purple-100 shrink-0">
                        <QRCode value={upiQrString} size={135} level="M" />
                      </div>
                      <div className="space-y-1.5 text-center sm:text-left">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[11px] font-bold">
                          <Smartphone className="h-3.5 w-3.5" /> {t("instantUpiQr", "Instant UPI QR")}
                        </div>
                        <div className="text-2xl font-black text-slate-900 font-mono">
                          ₹{totals.totalAmount.toFixed(2)}
                        </div>
                        <p className="text-xs text-slate-700">
                          Payee: <strong className="text-slate-900">{shopName}</strong>
                        </p>
                        <p className="text-xs font-mono text-purple-800">
                          UPI ID: {dynamicUpiId}
                        </p>
                        <p className="text-[11px] text-slate-500 pt-0.5">
                          {t("scanAndPay", "Customer can scan using Google Pay, PhonePe, Paytm, or BHIM.")}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* If "UDHARI" is selected: show Notice */}
            {paymentType === "UDHARI" && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-1">
                <div className="flex items-center justify-between font-bold text-sm text-red-800">
                  <span>Udhari (Credit) Bill</span>
                  <span className="font-mono">₹{totals.totalAmount.toFixed(2)} Unpaid</span>
                </div>
                <p>
                  • Bill status will be set to <strong>UNPAID</strong> with ₹0 amount paid.
                </p>
                <p>
                  • This bill will appear in customer's credit record and under <strong>/udhari</strong>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT 1 COLUMN: STICKY BILL SUMMARY & ACTIONS ================= */}
        <div className="space-y-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Bill Summary</span>
              <span className="text-xs font-normal text-slate-500 font-mono">
                {watchedItems.length} {watchedItems.length === 1 ? "row" : "rows"}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{totals.subtotal.toFixed(2)}</span>
              </div>

              {totals.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST:</span>
                  <span className="font-semibold text-slate-900">₹{totals.taxAmount.toFixed(2)}</span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600">Discount (₹):</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="h-8 w-24 text-right text-xs"
                  {...register("discountAmount")}
                />
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-baseline pt-1">
                <span className="font-bold text-slate-900 text-sm">Grand Total:</span>
                <span className="text-2xl font-black text-slate-900 font-mono">
                  ₹{totals.totalAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Payment Mode:</span>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold uppercase ${
                    paymentType === "UDHARI"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-purple-50 text-purple-700 border-purple-200"
                  }`}
                >
                  {paymentType === "UDHARI" ? "Udhari (Credit)" : paidSubMode}
                </Badge>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{totals.paidAmount.toFixed(2)}</span>
              </div>

              {totals.balanceAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{totals.balanceAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator className="my-3" />

            {/* ACTION BUTTONS (TASK 4) */}
            <div className="space-y-2.5 pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                onClick={() => setSaveAndPrint(true)}
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 rounded-xl transition"
              >
                {isSubmitting && saveAndPrint ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Processing Bill...
                  </>
                ) : (
                  <>
                    <Printer className="h-4 w-4" /> {t("saveAndPrint", "Save & Print Bill")}
                  </>
                )}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="outline"
                  onClick={() => setSaveAndPrint(false)}
                  className="w-full h-9 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
                >
                  {isSubmitting && !saveAndPrint ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-slate-500 mr-1" /> Save Only
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsHoldDialogOpen(true)}
                  className="w-full h-9 border-amber-200 text-amber-800 hover:bg-amber-50 text-xs font-semibold rounded-xl"
                >
                  <PauseCircle className="h-3.5 w-3.5 text-amber-600 mr-1" /> Hold Bill
                </Button>
              </div>
            </div>

            {/* WhatsApp PDF Attachment Guidance */}
            <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3 text-center space-y-1">
              <p className="text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                <span>📄 WhatsApp Sharing on Save</span>
              </p>
              <p className="text-[11px] text-emerald-800 leading-tight">
                Bill opens on Invoice View page where you can print and click <strong>Share to WhatsApp</strong> directly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hold Bill Modal Dialog */}
      <HoldBillDialog
        open={isHoldDialogOpen}
        onOpenChange={setIsHoldDialogOpen}
        getBillPayload={() => ({
          customerName: watch("customerName") || undefined,
          customerMobile: watch("customerMobile") || undefined,
          payload: {
            ...form.getValues(),
            items: watchedItems,
            totalAmount: totals.totalAmount,
          },
        })}
        onHoldSuccess={() => {
          reset({
            customerName: "",
            customerMobile: "",
            customerAddress: "",
            customerGstNo: "",
            paymentMode: PaymentMode.CASH,
            discountAmount: 0,
            amountPaid: undefined,
            items: [
              {
                productId: undefined,
                name: "",
                qty: 1,
                price: 0,
                taxRate: 0,
                itemDiscount: 0,
                discountType: "amount",
              },
            ],
          });
          setHeldBillId(null);
        }}
      />

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
