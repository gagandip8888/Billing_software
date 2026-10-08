"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Zap, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { PLANS, PlanId } from "@/lib/plans";

interface PlanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: PlanId;
  billLimit?: number;
  billsThisMonth?: number;
  onUpgradeClick?: () => void;
}

export function PlanLimitModal({
  open,
  onOpenChange,
  currentPlan = "FREE",
  billLimit = 50,
  billsThisMonth = 50,
  onUpgradeClick,
}: PlanLimitModalProps) {
  const basicPlan = PLANS.BASIC;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-center text-slate-900">
            Monthly Bill Limit Reached
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-500">
            You have generated{" "}
            <span className="font-bold text-slate-800">
              {billsThisMonth} / {billLimit} bills
            </span>{" "}
            for this month on the{" "}
            <span className="font-semibold text-slate-700">{currentPlan}</span> plan.
          </DialogDescription>
        </DialogHeader>

        {/* Upgrade Suggestion Box */}
        <div className="my-3 p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs font-bold text-blue-900 uppercase">
                Recommended Upgrade: Basic Plan
              </span>
            </div>
            <span className="text-sm font-black text-blue-900">₹299/mo</span>
          </div>

          <p className="text-xs text-blue-800">
            Get instant access to <strong>500 bills per month</strong>, thermal 80mm printing, and GST compliance.
          </p>

          <ul className="text-xs text-blue-700 space-y-1">
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>500 invoices every month</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Thermal printing (80mm & 58mm)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
              <span>GST Reports & Customer Ledger</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs"
          >
            Close
          </Button>
          <Link
            href="/subscription"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            <Zap className="h-3.5 w-3.5" />
            Upgrade with Razorpay
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
