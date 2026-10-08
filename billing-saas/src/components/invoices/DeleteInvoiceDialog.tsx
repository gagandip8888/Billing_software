"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DeleteInvoiceDialogProps {
  invoiceId: string;
  invoiceNo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  redirectOnSuccess?: boolean;
}

export function DeleteInvoiceDialog({
  invoiceId,
  invoiceNo,
  open,
  onOpenChange,
  onSuccess,
  redirectOnSuccess = false,
}: DeleteInvoiceDialogProps) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear confirmation text when dialog opens or closes
  useEffect(() => {
    if (!open) {
      setConfirmText("");
      setIsDeleting(false);
    }
  }, [open]);

  const isConfirmed = confirmText.trim() === invoiceNo.trim();

  async function handleDelete() {
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}?permanent=true`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete invoice");
      }

      toast.success(`Invoice ${invoiceNo} deleted permanently`);
      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }

      if (redirectOnSuccess) {
        router.push("/invoices");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Delete invoice error:", err);
      toast.error(`Failed to delete invoice: ${err.message || "Unknown error"}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-red-200">
        <AlertDialogHeader className="space-y-3">
          <div className="h-11 w-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto sm:mx-0 shadow-inner">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <AlertDialogTitle className="text-lg font-bold text-slate-900">
            Delete Invoice Permanently?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed space-y-2">
            <span>
              This will permanently delete invoice{" "}
              <strong className="text-slate-900 font-bold">{invoiceNo}</strong>. This action{" "}
              <strong className="text-red-600 font-bold">CANNOT</strong> be undone.
            </span>
            <span className="block text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
              ⚠️ Stock quantities will be restored to your inventory and linked customer
              balance will be recalculated automatically.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 my-2">
          <label className="text-xs font-semibold text-slate-700 block">
            Type <span className="font-mono font-bold text-red-600 select-all">{invoiceNo}</span> to
            confirm:
          </label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={`Type ${invoiceNo}`}
            disabled={isDeleting}
            className="h-10 text-xs font-mono border-slate-300 focus-visible:ring-red-500"
            autoComplete="off"
            autoFocus
          />
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
          <AlertDialogCancel
            disabled={isDeleting}
            className="text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={!isConfirmed || isDeleting}
            onClick={handleDelete}
            className="text-xs h-9 bg-red-600 hover:bg-red-700 font-semibold shadow-md shadow-red-500/20 flex items-center gap-1.5"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Permanently
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Reusable Delete Button with integrated confirmation dialog
 */
export function DeleteInvoiceButton({
  invoiceId,
  invoiceNo,
  className,
  redirectOnSuccess = true,
}: {
  invoiceId: string;
  invoiceNo: string;
  className?: string;
  redirectOnSuccess?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className={`h-9 text-xs font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 flex items-center gap-1.5 ${
          className || ""
        }`}
        title="Permanently delete invoice"
      >
        <Trash2 className="h-3.5 w-3.5" />
        <span>Delete</span>
      </Button>

      <DeleteInvoiceDialog
        invoiceId={invoiceId}
        invoiceNo={invoiceNo}
        open={open}
        onOpenChange={setOpen}
        redirectOnSuccess={redirectOnSuccess}
      />
    </>
  );
}
