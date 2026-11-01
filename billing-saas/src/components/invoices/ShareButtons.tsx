"use client";

import React, { useState } from "react";
import { MessageCircle, Printer, Copy, Check, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonsProps {
  invoiceId: string;
  invoiceNo: string;
  totalAmount: number;
  businessName: string;
  customerName?: string | null;
  customerMobile?: string | null;
}

export function ShareButtons({
  invoiceId,
  invoiceNo,
  totalAmount,
  businessName,
  customerName,
  customerMobile,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(`/invoices/${invoiceId}`);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setInvoiceUrl(`${window.location.origin}/invoices/${invoiceId}`);
    }
  }, [invoiceId]);

  // Clean mobile for wa.me link (91 + 10 digits)
  const mobileDigits = (customerMobile || "").replace(/\D/g, "");
  const cleanMobile = mobileDigits.length >= 10 ? `91${mobileDigits.slice(-10)}` : "";

  const displayName = customerName?.trim() || "Customer";
  const whatsappMessage = `Hi ${displayName}, here is your bill from ${businessName}. Total: ₹${totalAmount.toFixed(
    2
  )}. View PDF: ${invoiceUrl}`;

  const whatsappHref = cleanMobile
    ? `https://wa.me/${cleanMobile}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  function handleCopy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(invoiceUrl);
      setCopied(true);
      toast.success("Invoice link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* WhatsApp Share */}
      <Button
        type="button"
        onClick={() => {
          window.open(whatsappHref, "_blank");
          toast.success("Bill saved. Please share the PDF on WhatsApp.");
        }}
        size="sm"
        className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
      >
        <MessageCircle className="h-4 w-4" /> Share to WhatsApp
      </Button>

      {/* Print Trigger */}
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
      >
        <Printer className="h-4 w-4 text-slate-500" /> Print
      </Button>

      {/* Copy Link */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4 text-slate-500" /> Copy Link
          </>
        )}
      </Button>

      {/* Full Page Print / PDF View */}
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button
          variant="outline"
          size="sm"
          className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
        >
          <ExternalLink className="h-4 w-4 text-slate-500" /> Printable PDF
        </Button>
      </a>
    </div>
  );
}
