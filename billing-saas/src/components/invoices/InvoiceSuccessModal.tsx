"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  MessageCircle,
  Printer,
  Plus,
  ArrowRight,
  Copy,
  Check,
  ExternalLink,
  Receipt,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface InvoiceSuccessData {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentMode?: string;
  customerName?: string | null;
  customerMobile?: string | null;
  isOffline?: boolean;
}

interface InvoiceSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceSuccessData | null;
  shopName: string;
  onNewBill: () => void;
}

export function InvoiceSuccessModal({
  open,
  onOpenChange,
  invoice,
  shopName,
  onNewBill,
}: InvoiceSuccessModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && invoice?.id) {
      const origin = window.location.origin;
      setInvoiceUrl(`${origin}/invoices/${invoice.id}`);
      setPdfUrl(`${origin}/api/invoices/${invoice.id}/pdf`);
    }
  }, [invoice?.id]);

  if (!invoice) return null;

  const customerName = invoice.customerName?.trim() || "Customer";
  const mobileDigits = (invoice.customerMobile || "").replace(/\D/g, "");
  const cleanMobile = mobileDigits.length >= 10 ? `91${mobileDigits.slice(-10)}` : "";

  const isDirectPaidMode =
    invoice.paymentMode === "CASH" ||
    invoice.paymentMode === "UPI" ||
    invoice.paymentMode === "CARD";
  const hasBalanceDue =
    invoice.paymentMode === "CREDIT" ||
    (!isDirectPaidMode && Number(invoice.balanceAmount) > 0);

  // Exact pre-filled WhatsApp message requested by user
  const whatsappMessage = `Hi ${customerName}, here is your bill #${invoice.invoiceNo} of ₹${Number(
    invoice.totalAmount
  ).toFixed(2)} from ${shopName}.\n\nView / Download Bill: ${invoiceUrl || pdfUrl}\n\nThank you for your business!`;

  const whatsappHref = cleanMobile
    ? `https://wa.me/${cleanMobile}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  function handleCopyLink() {
    const linkToCopy = invoiceUrl || pdfUrl;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(linkToCopy);
      setCopied(true);
      toast.success("Invoice link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl border border-slate-200">
        <DialogHeader className="text-center space-y-2">
          {/* Animated Success Badge */}
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-200 shadow-sm animate-in zoom-in-75 duration-200">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>

          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            Bill Created Successfully!
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Invoice <strong className="text-slate-800 font-mono">#{invoice.invoiceNo}</strong> has been generated and recorded.
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary Card */}
        <div className="my-2 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Customer</span>
            <span className="font-bold text-slate-900">
              {customerName}
              {invoice.customerMobile && (
                <span className="font-mono text-slate-500 font-normal ml-1">
                  ({invoice.customerMobile})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span>Payment Mode</span>
            <Badge variant="outline" className="text-[10px] font-bold bg-white text-slate-700 uppercase">
              {invoice.paymentMode || "CASH"}
            </Badge>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
            <span className="font-bold text-slate-700 text-sm">Total Amount</span>
            <span className="text-lg font-black text-slate-900 font-mono">
              ₹{Number(invoice.totalAmount).toFixed(2)}
            </span>
          </div>

          {hasBalanceDue ? (
            <div className="flex items-center justify-between text-rose-600 font-semibold pt-1">
              <span>Balance Due (Khata)</span>
              <span className="font-mono font-bold">₹{Number(invoice.balanceAmount).toFixed(2)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1">
              <span>Payment Status</span>
              <span className="font-bold text-emerald-800 uppercase tracking-wide">PAID</span>
            </div>
          )}

          {invoice.isOffline && (
            <div className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium">
              ⚡ Saved in offline browser storage. Will sync to cloud once online.
            </div>
          )}
        </div>

        {/* PRIMARY ACTION: WhatsApp Bill Sharing (Direct native link to avoid popup block) */}
        <div className="space-y-2 pt-1">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 rounded-xl flex items-center justify-center gap-2 transition select-none cursor-pointer"
          >
            <MessageCircle className="h-5 w-5 fill-current" />
            <span>Share on WhatsApp</span>
          </a>

          {/* Quick Print & Copy Row */}
          <div className="grid grid-cols-2 gap-2">
            <a
              href={`/invoices/${invoice?.id}?print=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5 transition select-none cursor-pointer"
            >
              <Printer className="h-4 w-4 text-purple-600" />
              <span>Print Bill</span>
            </a>

            <Button
              type="button"
              variant="outline"
              onClick={handleCopyLink}
              className="h-10 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* BOTTOM ACTIONS: Next Bill & View All */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <Button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNewBill();
            }}
            className="flex-1 h-9 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Create Next Bill</span>
          </Button>

          <Link href="/invoices" className="flex-1">
            <Button
              type="button"
              variant="ghost"
              className="w-full h-9 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              <span>View All Bills</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
