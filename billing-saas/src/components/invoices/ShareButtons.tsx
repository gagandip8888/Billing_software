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

  // Clean mobile for wa.me link
  let cleanMobile = (customerMobile || "").replace(/\D/g, "");
  if (cleanMobile.length === 10) {
    cleanMobile = "91" + cleanMobile; // Default to India country code
  }

  const invoiceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invoices/${invoiceId}`
      : `/invoices/${invoiceId}`;

  const displayName = customerName?.trim() || "Customer";
  const whatsappMessage = `Hi ${displayName}, your bill #${invoiceNo} of ₹${totalAmount.toFixed(
    2
  )} from ${businessName} is ready. View invoice: ${invoiceUrl}`;

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
      <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
        <Button
          size="sm"
          className="h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp Bill
        </Button>
      </a>

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
