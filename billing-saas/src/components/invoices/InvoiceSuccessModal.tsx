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
  Download,
  Loader2,
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
import { shareInvoicePdfDirect, generateInvoicePDF } from "@/lib/generate-invoice-pdf";

export interface InvoiceSuccessData {
  id: string;
  invoiceNo: string;
  totalAmount: number;
  paidAmount?: number;
  balanceAmount?: number;
  paymentMode?: string;
  customerName?: string | null;
  customerMobile?: string | null;
  subtotal?: number;
  taxAmount?: number;
  discountAmount?: number;
  items?: Array<{
    name: string;
    qty: number;
    price: number;
    taxRate?: number;
    total: number;
  }>;
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
  const [isSharingPdf, setIsSharingPdf] = useState(false);

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

  async function handleShareWhatsApp() {
    if (!invoice) return;
    setIsSharingPdf(true);
    try {
      await shareInvoicePdfDirect(
        {
          invoiceNo: invoice.invoiceNo,
          invoiceDate: new Date(),
          shopName,
          customerName,
          customerMobile: invoice.customerMobile,
          items:
            invoice.items && invoice.items.length > 0
              ? invoice.items
              : [
                  {
                    name: "Sale Item",
                    qty: 1,
                    price: Number(invoice.totalAmount),
                    total: Number(invoice.totalAmount),
                  },
                ],
          subtotal: invoice.subtotal ?? Number(invoice.totalAmount),
          taxAmount: invoice.taxAmount ?? 0,
          discountAmount: invoice.discountAmount ?? 0,
          totalAmount: Number(invoice.totalAmount),
          paidAmount: Number(invoice.paidAmount ?? 0),
          balanceAmount: Number(invoice.balanceAmount ?? 0),
          paymentMode: invoice.paymentMode || "CASH",
        },
        {
          onSuccess: () => {
            toast.success("Opening WhatsApp with PDF bill...");
          },
        }
      );
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to share PDF: " + err.message);
    } finally {
      setIsSharingPdf(false);
    }
  }

  function handleDownloadPdf() {
    if (!invoice) return;
    try {
      const { download } = generateInvoicePDF({
        invoiceNo: invoice.invoiceNo,
        invoiceDate: new Date(),
        shopName,
        customerName,
        customerMobile: invoice.customerMobile,
        items:
          invoice.items && invoice.items.length > 0
            ? invoice.items
            : [
                {
                  name: "Sale Item",
                  qty: 1,
                  price: Number(invoice.totalAmount),
                  total: Number(invoice.totalAmount),
                },
              ],
        subtotal: invoice.subtotal ?? Number(invoice.totalAmount),
        taxAmount: invoice.taxAmount ?? 0,
        discountAmount: invoice.discountAmount ?? 0,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount ?? 0),
        balanceAmount: Number(invoice.balanceAmount ?? 0),
        paymentMode: invoice.paymentMode || "CASH",
      });
      download();
      toast.success(`Downloaded Invoice-${invoice.invoiceNo}.pdf`);
    } catch (err: any) {
      toast.error("Download failed: " + err.message);
    }
  }

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

        {/* PRIMARY ACTION: WhatsApp Bill Sharing (Direct PDF attachment & download) */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={isSharingPdf}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {isSharingPdf ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Generating PDF...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5 fill-current" />
                <span>Share PDF on WhatsApp</span>
              </>
            )}
          </Button>

          {/* Quick Print & Direct PDF Download Row */}
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
              onClick={handleDownloadPdf}
              className="h-10 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4 text-slate-600" />
              <span>Download PDF</span>
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
