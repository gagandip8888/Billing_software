"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle, Loader2, KeyRound, Eye, EyeOff, ShieldAlert } from "lucide-react";
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
import { useLanguage } from "@/lib/language-context";

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
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasConfiguredPassword, setHasConfiguredPassword] = useState<boolean | null>(null);
  const [isCheckingSettings, setIsCheckingSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check tenant settings for delete password whenever the dialog opens
  useEffect(() => {
    if (open) {
      setPassword("");
      setShowPassword(false);
      setErrorMsg(null);
      setIsCheckingSettings(true);

      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          const pwd = data?.setting?.deletePassword;
          setHasConfiguredPassword(Boolean(pwd && pwd.trim().length > 0));
        })
        .catch((err) => {
          console.error("Failed to check delete password setting:", err);
          setHasConfiguredPassword(false);
        })
        .finally(() => {
          setIsCheckingSettings(false);
        });
    } else {
      setPassword("");
      setIsDeleting(false);
      setErrorMsg(null);
    }
  }, [open]);

  async function handleDelete() {
    if (isDeleting) return;

    if (hasConfiguredPassword && !password.trim()) {
      setErrorMsg("Please enter the Admin Password to delete this bill.");
      toast.error("Please enter the Admin Password to delete this bill.");
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}?permanent=true`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-delete-password": password.trim(),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.error || "Incorrect password. Cannot delete bill.";
        setErrorMsg(errorText);
        throw new Error(errorText);
      }

      toast.success("Bill deleted successfully");
      onOpenChange(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
        window.dispatchEvent(new CustomEvent("billingsaas:bill-saved"));
      }

      if (onSuccess) {
        onSuccess();
      }

      if (redirectOnSuccess) {
        router.push("/invoices");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Delete invoice error:", err);
      toast.error(err.message || "Failed to delete bill");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md border-red-200">
        <AlertDialogHeader className="space-y-3">
          <div className="h-11 w-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto sm:mx-0 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <AlertDialogTitle className="text-lg font-bold text-slate-900">
            {t("deleteBillModalTitle", "Enter Admin Password to delete this bill")}
          </AlertDialogTitle>

          <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed space-y-2">
            <span>
              Invoice <strong className="text-slate-900 font-bold">#{invoiceNo}</strong> will be permanently deleted.
            </span>
            <span className="block text-[11px] text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
              ⚠️ Stock quantities will be restored to your inventory and customer credit balance will be recalculated automatically.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isCheckingSettings ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            <span>Verifying security settings...</span>
          </div>
        ) : (
          <div className="space-y-3 my-2">
            {hasConfiguredPassword === false ? (
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg p-3 text-xs text-amber-800 space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-900">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>No Password Protection Configured</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  {t(
                    "noPasswordWarning",
                    "No password set. Anyone can delete bills. Please set one in Settings."
                  )}
                </p>
                <div className="pt-1">
                  <a
                    href="/settings?tab=profile"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 underline hover:text-amber-950"
                  >
                    Set Delete Password in Settings &rarr;
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-slate-500" />
                  <span>{t("enterPassword", "Enter Admin Password")}:</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Enter admin password..."
                    disabled={isDeleting}
                    className={`h-10 text-xs pr-10 border-slate-300 focus-visible:ring-red-500 ${
                      errorMsg ? "border-red-500 bg-red-50/40" : ""
                    }`}
                    autoComplete="off"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && password.trim()) {
                        handleDelete();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-red-600 font-medium">{errorMsg}</p>
                )}
                <p className="text-[11px] text-slate-500">
                  Password configured in Settings &gt; Shop Profile.
                </p>
              </div>
            )}
          </div>
        )}

        <AlertDialogFooter className="gap-2 sm:gap-0 mt-3">
          <AlertDialogCancel
            disabled={isDeleting}
            className="text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100"
          >
            {t("cancel", "Cancel")}
          </AlertDialogCancel>

          <Button
            type="button"
            variant="destructive"
            disabled={
              isDeleting ||
              isCheckingSettings ||
              (hasConfiguredPassword === true && !password.trim())
            }
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
                {t("confirmDelete", "Delete Bill")}
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
