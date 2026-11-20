"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldAlert, KeyRound, Eye, EyeOff, Loader2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CashierEditAuthGuardProps {
  isCashier: boolean;
  invoiceId: string;
  invoiceNo: string;
  children: React.ReactNode;
}

export function CashierEditAuthGuard({
  isCashier,
  invoiceId,
  invoiceNo,
  children,
}: CashierEditAuthGuardProps) {
  const [isAuthorized, setIsAuthorized] = useState(!isCashier);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (isAuthorized) {
    return <>{children}</>;
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg("Please enter the Store Owner Password to authorize editing this bill.");
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/auth/verify-owner-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        const msg = data.error || "Incorrect Store Owner Password";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      toast.success("Owner authorized! Bill editing unlocked.");
      setIsAuthorized(true);
    } catch (err: any) {
      console.error("Owner auth error:", err);
      setErrorMsg(err.message || "Failed to verify owner password");
      toast.error("Failed to verify owner password");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-6">
      <div className="text-center space-y-3">
        <div className="h-14 w-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Owner Authorization Required
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Employees cannot edit bills directly. Please ask the <strong className="text-slate-900">Store Owner</strong> to enter their password to modify bill <strong className="text-slate-900 font-mono">#{invoiceNo}</strong>.
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-slate-500" />
            <span>Store Owner Password:</span>
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Enter owner password or admin PIN..."
              disabled={isVerifying}
              className={`h-10 text-xs pr-10 border-slate-300 focus-visible:ring-amber-500 ${
                errorMsg ? "border-red-500 bg-red-50/40" : ""
              }`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errorMsg && (
            <p className="text-[11px] text-red-600 font-medium">{errorMsg}</p>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Link href={`/invoices/${invoiceId}`} className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full h-10 text-xs font-semibold border-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isVerifying}
            className="flex-1 h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md rounded-xl"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Verifying...
              </>
            ) : (
              "Authorize Edit"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
