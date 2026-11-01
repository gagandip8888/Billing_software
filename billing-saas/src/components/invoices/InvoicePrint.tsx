"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Receipt,
  Printer,
  FileText,
  ArrowLeft,
  MessageCircle,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { numberToWordsIndian } from "@/lib/invoice-utils";

interface InvoicePrintProps {
  invoice: any;
  tenant: any;
  autoPrint?: boolean;
}

export function InvoicePrint({ invoice, tenant, autoPrint = false }: InvoicePrintProps) {
  const searchParams = useSearchParams();
  const [printFormat, setPrintFormat] = useState<"THERMAL" | "A4">("THERMAL");
  const [copied, setCopied] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(`/invoices/${invoice.id}`);
  const autoPrintRef = React.useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setInvoiceUrl(`${window.location.origin}/invoices/${invoice.id}`);
    }
  }, [invoice.id]);

  // Auto-print after 1 second if print=true or autoPrint prop is passed
  useEffect(() => {
    const hasPrintQuery =
      typeof window !== "undefined" &&
      (new URLSearchParams(window.location.search).get("print") === "true" ||
        window.location.href.includes("print=true"));
    const shouldPrint = hasPrintQuery || searchParams?.get("print") === "true" || autoPrint;

    if (shouldPrint && !autoPrintRef.current) {
      autoPrintRef.current = true;
      const timer = setTimeout(() => {
        if (typeof window !== "undefined") {
          window.print();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, autoPrint]);

  // Customer Details
  const customerName =
    invoice.customer?.name ||
    invoice.metadata?.walkInCustomerName ||
    "Cash / Walk-in Customer";
  const customerMobile =
    invoice.customer?.mobile ||
    invoice.metadata?.walkInCustomerMobile ||
    "";
  const customerAddress =
    invoice.customer?.address ||
    invoice.metadata?.customerAddress ||
    "";
  const customerGst =
    invoice.customer?.gstNo ||
    invoice.metadata?.customerGstNo ||
    "";

  // Date & Time formatting
  const invoiceDate = new Date(invoice.invoiceDate || invoice.createdAt || Date.now());
  const dateFormatted = invoiceDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = invoiceDate.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  // Calculate item breakdown: Gross subtotal, item discounts, tax
  let itemsGrossSubtotal = 0;
  let totalItemDiscount = 0;
  let totalTaxCalculated = 0;

  const processedItems = (invoice.items || []).map((item: any) => {
    const qty = Number(item.qty || 1);
    const rate = Number(item.price || 0); // Actual Selling Price
    const rawDisc = Number(item.itemDiscount || 0);
    const dType = item.discountType || "amount";

    let lineDiscount = 0;
    if (dType === "percent") {
      lineDiscount = Math.round(qty * rate * (rawDisc / 100) * 100) / 100;
    } else {
      lineDiscount = Math.min(qty * rate, rawDisc);
    }

    const lineGross = qty * rate;
    const lineNet = Math.max(0, lineGross - lineDiscount);
    const lineTax = Number(item.taxAmount || 0);
    const lineTotal = Number(item.total) || Math.round((lineNet + lineTax) * 100) / 100;

    itemsGrossSubtotal += lineGross;
    totalItemDiscount += lineDiscount;
    totalTaxCalculated += lineTax;

    // NEVER show internal database ID (e.g. cmvvmc...) or costPrice/mrp to customer.
    // Only show clothing/product variant attributes if present: Size, Color, Brand.
    const variantAttributes = [
      item.size ? `Size: ${item.size}` : null,
      item.color ? `Color: ${item.color}` : null,
      item.brand ? `Brand: ${item.brand}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    return {
      ...item,
      qty,
      rate,
      lineGross,
      lineDiscount,
      lineTotal,
      variantAttributes,
    };
  });

  const billDiscount = Number(invoice.discountAmount || 0);
  const tax = Number(invoice.taxAmount || totalTaxCalculated);
  const grandTotal = Number(invoice.totalAmount || 0);
  const paidAmount = Number(invoice.paidAmount ?? grandTotal);
  const balanceAmount = Number(invoice.balanceAmount ?? Math.max(0, grandTotal - paidAmount));

  // Total discount across line items and bill level
  const totalCombinedDiscount = Math.round((totalItemDiscount + billDiscount) * 100) / 100;

  // Resolve display subtotal & discount so that: Subtotal - Discount + Tax = Grand Total
  let displaySubtotal = itemsGrossSubtotal > 0 ? itemsGrossSubtotal : Number(invoice.subtotal || 0);
  let displayDiscount = totalCombinedDiscount;

  if (displayDiscount > 0 && displaySubtotal <= grandTotal && tax === 0) {
    displaySubtotal = Math.round((grandTotal + displayDiscount) * 100) / 100;
  } else if (displayDiscount === 0 && displaySubtotal > grandTotal && tax === 0) {
    displayDiscount = Math.round((displaySubtotal - grandTotal) * 100) / 100;
  }

  // Payment Mode resolution
  const rawMode = invoice.paymentMode;
  const isUdhari =
    rawMode === "CREDIT" ||
    invoice.status === "UNPAID" ||
    (balanceAmount > 0 && paidAmount === 0);

  let displayPaymentMode = "Cash";
  if (isUdhari) {
    displayPaymentMode = "Udhari (Credit)";
  } else if (rawMode === "UPI") {
    displayPaymentMode = "UPI";
  } else if (rawMode === "CARD") {
    displayPaymentMode = "Card / POS";
  } else if (rawMode === "BANK_TRANSFER") {
    displayPaymentMode = "Bank Transfer";
  } else if (Array.isArray(invoice.payments) && invoice.payments.length > 0) {
    displayPaymentMode = invoice.payments
      .map((p: any) => `${p.mode}: ₹${Number(p.amount).toFixed(2)}`)
      .join(", ");
  }

  // Shop details & UPI QR Code
  const shopName = tenant?.businessName || "Retail Store";
  const shopAddress = [tenant?.address, tenant?.city, tenant?.pincode]
    .filter(Boolean)
    .join(", ");
  const shopMobile = tenant?.mobile || "";
  const shopGstin = tenant?.gstNo || "";
  const upiId = tenant?.settings?.upiId || tenant?.setting?.upiId || "";

  const amountToCollect = balanceAmount > 0 ? balanceAmount : grandTotal;
  const upiQrString = upiId
    ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        shopName
      )}&am=${encodeURIComponent(amountToCollect.toFixed(2))}&cu=INR`
    : "";

  // WhatsApp Share URL
  const cleanMobile = (customerMobile || "").replace(/\D/g, "");
  const mobile10 = cleanMobile.slice(-10);

  const whatsappMessage = `Hi ${customerName}, your bill #${
    invoice.invoiceNo
  } of ₹${grandTotal.toFixed(
    2
  )} from ${shopName} is ready.\nPayment Mode: ${displayPaymentMode}${
    displayDiscount > 0 ? `\nDiscount: ₹${displayDiscount.toFixed(2)}` : ""
  }${
    balanceAmount > 0 ? `\nBalance Due: ₹${balanceAmount.toFixed(2)}` : ""
  }\nThank you! Visit again.\nView Bill: ${invoiceUrl}`;

  const whatsappHref = mobile10
    ? `https://wa.me/91${mobile10}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      toast.success("Invoice link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto py-2">
      {/* Dynamic CSS @media print styling based on chosen format */}
      <style
        dangerouslySetInnerHTML={{
          __html:
            printFormat === "THERMAL"
              ? `
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              html, body {
                width: 80mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace !important;
              }
              .print-hide, nav, header, aside, button, .action-bar {
                display: none !important;
              }
              .thermal-receipt-container {
                display: block !important;
                width: 76mm !important;
                max-width: 76mm !important;
                margin: 0 auto !important;
                padding: 3mm 2mm !important;
                border: none !important;
                box-shadow: none !important;
                font-size: 11px !important;
              }
              .a4-invoice-container {
                display: none !important;
              }
            }
          `
              : `
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              html, body {
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
              }
              .print-hide, nav, header, aside, button, .action-bar {
                display: none !important;
              }
              .a4-invoice-container {
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }
              .thermal-receipt-container {
                display: none !important;
              }
            }
          `,
        }}
      />

      {/* Top Controls / Action Bar (Hidden when printing) */}
      <div className="action-bar flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm print:hidden">
        <div className="flex items-center gap-2.5">
          <Link href="/invoices">
            <Button variant="ghost" size="sm" className="h-9 text-xs text-slate-600 gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Back to Invoices
            </Button>
          </Link>

          {/* Format Toggle (Thermal 80mm vs A4) */}
          <div className="flex rounded-xl border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setPrintFormat("THERMAL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                printFormat === "THERMAL"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="h-3.5 w-3.5" /> Thermal (80mm)
            </button>
            <button
              type="button"
              onClick={() => setPrintFormat("A4")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                printFormat === "A4"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileText className="h-3.5 w-3.5" /> A4 / A5 Invoice
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share on WhatsApp Button */}
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button
              size="sm"
              className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 rounded-xl"
            >
              <MessageCircle className="h-4 w-4" /> Share on WhatsApp
            </Button>
          </a>

          {/* Copy Link Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy Link
              </>
            )}
          </Button>

          {/* Print Now Button */}
          <Button
            onClick={() => window.print()}
            size="sm"
            className="h-9 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1.5 rounded-xl"
          >
            <Printer className="h-4 w-4" /> Print Bill
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. 80MM THERMAL RECEIPT FORMAT (Hides internal DB ID & costPrice)         */}
      {/* ========================================================================= */}
      {printFormat === "THERMAL" && (
        <div className="thermal-receipt-container bg-white rounded-2xl border border-slate-300 p-5 shadow-md w-[80mm] max-w-full mx-auto text-[11px] font-mono leading-tight text-slate-900">
          {/* SECTION 1: HEADER (Center) */}
          <div className="text-center border-b border-dashed border-slate-400 pb-2.5 mb-2.5 space-y-0.5">
            <div className="font-black text-sm uppercase tracking-tight text-slate-900">
              {shopName}
            </div>
            {shopAddress && (
              <div className="text-[10px] text-slate-700 leading-snug">
                {shopAddress}
              </div>
            )}
            {shopMobile && (
              <div className="text-[10px] text-slate-700">
                Tel: {shopMobile}
              </div>
            )}
            {shopGstin && (
              <div className="text-[10px] font-bold text-slate-900">
                GSTIN: {shopGstin}
              </div>
            )}
          </div>

          {/* SECTION 2: INVOICE DETAILS (Left / Right Split) */}
          <div className="border-b border-dashed border-slate-400 pb-2 mb-2 text-[10px] grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <div>
                Bill No: <strong className="font-bold">{invoice.invoiceNo}</strong>
              </div>
              <div>Date: {dateFormatted}</div>
              <div>Time: {timeFormatted}</div>
            </div>
            <div className="text-right space-y-0.5">
              <div className="font-bold truncate">{customerName}</div>
              {customerMobile && <div>Mob: {customerMobile}</div>}
              {customerAddress && <div className="truncate">{customerAddress}</div>}
              {customerGst && <div>GST: {customerGst}</div>}
            </div>
          </div>

          {/* SECTION 3: ITEMS TABLE (# | Item | Qty | Rate | Amount) */}
          <div className="border-b border-dashed border-slate-400 pb-2 mb-2">
            <table className="w-full text-left text-[10px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300 font-bold text-slate-800">
                  <th className="py-1 w-4">#</th>
                  <th className="py-1">Item</th>
                  <th className="py-1 text-center w-8">Qty</th>
                  <th className="py-1 text-right w-12">Rate</th>
                  <th className="py-1 text-right w-14">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedItems.map((item: any, idx: number) => (
                  <tr key={idx} className="align-top">
                    <td className="py-1 text-slate-500">{idx + 1}</td>
                    <td className="py-1 pr-1">
                      <div className="font-bold text-slate-900 leading-snug">
                        {item.name}
                      </div>
                      {/* Variant Specs (Size / Color ONLY, NO internal DB ID) */}
                      {item.variantAttributes && (
                        <div className="text-[9px] text-slate-500 font-normal">
                          {item.variantAttributes}
                        </div>
                      )}
                      {/* Item-level discount indication if applied */}
                      {item.lineDiscount > 0 && (
                        <div className="text-[9px] text-emerald-700 font-bold">
                          Disc: -₹{item.lineDiscount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-1 text-center">{item.qty}</td>
                    <td className="py-1 text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="py-1 text-right font-bold">₹{item.lineTotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 4: TOTALS (Right Aligned with clean discount breakdown) */}
          <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-400 mb-2">
            <div className="flex justify-between text-slate-700">
              <span>Subtotal:</span>
              <span className="font-semibold">₹{displaySubtotal.toFixed(2)}</span>
            </div>

            {displayDiscount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount:</span>
                <span>-₹{displayDiscount.toFixed(2)}</span>
              </div>
            )}

            {tax > 0 && (
              <>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>CGST:</span>
                  <span>₹{(tax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>SGST:</span>
                  <span>₹{(tax / 2).toFixed(2)}</span>
                </div>
              </>
            )}

            <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300 text-slate-900">
              <span>GRAND TOTAL:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-700 pt-0.5">
              <span>Payment Mode:</span>
              <span className="font-bold uppercase text-purple-800">{displayPaymentMode}</span>
            </div>

            <div className="flex justify-between text-[10px] text-slate-700">
              <span>Amount Paid:</span>
              <span className="font-semibold text-emerald-700">₹{paidAmount.toFixed(2)}</span>
            </div>

            {balanceAmount > 0 && (
              <div className="flex justify-between text-[10px] font-bold text-red-700">
                <span>BALANCE DUE:</span>
                <span>₹{balanceAmount.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* SECTION 5: PAYMENT & FOOTER (QR code + Thank you + Sign) */}
          <div className="space-y-2 pt-1 text-center">
            {/* Small UPI QR Code */}
            {amountToCollect > 0 && upiId && (
              <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 border border-slate-200">
                <div className="p-1.5 bg-white rounded border border-slate-300">
                  <QRCode value={upiQrString} size={75} level="M" />
                </div>
                <span className="text-[9px] font-bold text-slate-700 mt-1">
                  Scan & Pay via UPI (₹{amountToCollect.toFixed(2)})
                </span>
                <span className="text-[8px] text-slate-500 font-mono">
                  {upiId}
                </span>
              </div>
            )}

            <div className="font-bold text-[10px] text-slate-800 pt-1">
              Thank you! Visit Again.
            </div>

            <div className="text-[9px] text-slate-500 text-right pt-2 border-t border-dotted border-slate-300">
              For {shopName}
              <div className="pt-4 text-[8px] text-slate-400">Authorized Signatory</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. A4 / A5 FULL INVOICE FORMAT (Hides internal DB ID & costPrice)         */}
      {/* ========================================================================= */}
      {printFormat === "A4" && (
        <div className="a4-invoice-container bg-white rounded-2xl border border-slate-300 p-8 shadow-md max-w-4xl mx-auto space-y-6 text-slate-900">
          {/* Header Banner */}
          <div className="flex justify-between items-start border-b-2 border-purple-600 pb-5">
            <div>
              <div className="text-2xl font-black uppercase tracking-tight text-slate-900">
                {shopName}
              </div>
              {shopAddress && (
                <div className="text-xs text-slate-600 mt-1 max-w-sm leading-relaxed">
                  {shopAddress}
                </div>
              )}
              {shopMobile && (
                <div className="text-xs text-slate-600 mt-0.5">
                  Mobile / Phone: <strong className="text-slate-800">{shopMobile}</strong>
                </div>
              )}
              {shopGstin && (
                <div className="text-xs font-bold text-slate-900 mt-1">
                  GSTIN: {shopGstin}
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 font-bold text-xs rounded-full uppercase tracking-wider">
                Tax Invoice
              </span>
              <div className="text-lg font-black font-mono text-slate-900 pt-1">
                #{invoice.invoiceNo}
              </div>
              <div className="text-xs text-slate-600">
                Date: <strong className="text-slate-800">{dateFormatted}</strong>
              </div>
              <div className="text-xs text-slate-600">
                Time: {timeFormatted}
              </div>
            </div>
          </div>

          {/* Billing Details Split (Left: Customer Details | Right: Payment Terms) */}
          <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs">
            <div>
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1.5">
                Billed To (Customer Details):
              </span>
              <div className="font-bold text-sm text-slate-900">{customerName}</div>
              {customerMobile && (
                <div className="text-slate-600 mt-0.5">Phone: {customerMobile}</div>
              )}
              {customerAddress && (
                <div className="text-slate-600 mt-0.5">{customerAddress}</div>
              )}
              {customerGst && (
                <div className="font-bold text-slate-800 mt-1">GSTIN: {customerGst}</div>
              )}
            </div>

            <div className="text-right">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px] block mb-1.5">
                Payment & Billing Terms:
              </span>
              <div className="space-y-1">
                <div>
                  Mode: <strong className="font-bold uppercase text-purple-700">{displayPaymentMode}</strong>
                </div>
                <div>
                  Status:{" "}
                  <strong className={isUdhari ? "text-red-600 uppercase" : "text-emerald-700 uppercase"}>
                    {isUdhari ? "UNPAID (UDHARI)" : "PAID"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table (# | Item Description | Qty | Rate | Amount) */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center w-20">Qty</th>
                  <th className="py-2.5 px-3 text-right w-28">Rate (₹)</th>
                  <th className="py-2.5 px-3 text-right w-32">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedItems.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{item.name}</div>
                      {/* Clean Variant Specs (NO database IDs, NO cost price) */}
                      {item.variantAttributes && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.variantAttributes}
                        </div>
                      )}
                      {/* Item Discount displayed clearly */}
                      {item.lineDiscount > 0 && (
                        <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
                          Discount: -₹{item.lineDiscount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-medium">{item.qty}</td>
                    <td className="py-2 px-3 text-right font-mono">₹{item.rate.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Left QR & Notes | Right Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start pt-2">
            {/* Left: UPI QR Code & Terms */}
            <div className="space-y-4">
              {amountToCollect > 0 && upiId && (
                <div className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 max-w-sm">
                  <div className="p-2 bg-white rounded-lg border border-slate-300 shrink-0">
                    <QRCode value={upiQrString} size={85} level="M" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-900 block">
                      Scan to Pay via UPI
                    </span>
                    <div className="text-sm font-black font-mono text-purple-800">
                      ₹{amountToCollect.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      UPI ID: {upiId}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Google Pay, PhonePe, Paytm, BHIM
                    </div>
                  </div>
                </div>
              )}

              {/* Amount in words */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Amount in Words:
                </span>
                <span className="font-semibold text-slate-800">
                  {numberToWordsIndian(grandTotal)}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700">Terms & Conditions:</span>
                <p>1. Goods once sold are subject to store policy.</p>
                <p>2. Computer generated tax invoice, no signature required.</p>
              </div>
            </div>

            {/* Right: Totals Box */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">₹{displaySubtotal.toFixed(2)}</span>
              </div>

              {displayDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount:</span>
                  <span>-₹{displayDiscount.toFixed(2)}</span>
                </div>
              )}

              {tax > 0 && (
                <>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>CGST:</span>
                    <span>₹{(tax / 2).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>SGST:</span>
                    <span>₹{(tax / 2).toFixed(2)}</span>
                  </div>
                </>
              )}

              <div className="border-t-2 border-slate-900 pt-2 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">Grand Total:</span>
                <span className="text-xl font-black font-mono text-slate-900">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-200">
                <span>Amount Paid:</span>
                <span>₹{paidAmount.toFixed(2)}</span>
              </div>

              {balanceAmount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>Balance Due:</span>
                  <span>₹{balanceAmount.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer & Authorized Signatory */}
          <div className="border-t border-slate-200 pt-6 flex justify-between items-end text-xs">
            <div className="font-bold text-purple-700 text-sm">
              Thank you! Visit Again.
            </div>

            <div className="text-center w-52">
              <div className="border-b border-dashed border-slate-400 pb-1 mb-1 font-bold text-slate-900">
                For {shopName}
              </div>
              <div className="text-[11px] text-slate-500">Authorized Signatory</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvoicePrint;
