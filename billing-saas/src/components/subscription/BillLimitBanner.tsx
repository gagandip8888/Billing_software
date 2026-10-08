import React from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Zap, ArrowRight } from "lucide-react";
import { SubscriptionStatus } from "@/lib/subscription";

interface BillLimitBannerProps {
  subscription: SubscriptionStatus;
}

export function BillLimitBanner({ subscription }: BillLimitBannerProps) {
  const { plan, planConfig, usage } = subscription;
  const { billsThisMonth, billLimit, remainingBills, percentageUsed } = usage;

  // Unlimited plans do not need a warning
  if (billLimit === -1) {
    return null;
  }

  // At or over limit
  if (remainingBills !== null && remainingBills <= 0) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900">
              Monthly Bill Limit Reached ({billsThisMonth}/{billLimit} bills)
            </h4>
            <p className="text-xs text-rose-700 mt-0.5">
              You have exhausted all bills on your <strong>{planConfig.name}</strong> plan for this month.
              Upgrade now to unlock 500+ bills and keep serving customers without interruption.
            </p>
          </div>
        </div>

        <Link
          href="/subscription"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition whitespace-nowrap"
        >
          <Zap className="h-3.5 w-3.5" />
          Upgrade Plan Now
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  // Approaching limit (>= 80%)
  if (percentageUsed >= 80) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">
              Approaching Monthly Bill Limit ({billsThisMonth}/{billLimit} bills used — {percentageUsed}%)
            </h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Only <strong>{remainingBills} bill{remainingBills === 1 ? "" : "s"} remaining</strong> this month on your {planConfig.name} plan.
              Upgrade to Basic (500 bills) or Pro (2000 bills) for uninterrupted billing.
            </p>
          </div>
        </div>

        <Link
          href="/subscription"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition whitespace-nowrap"
        >
          <Zap className="h-3.5 w-3.5" />
          Upgrade Plan
        </Link>
      </div>
    );
  }

  // Under 80% on Free Plan
  if (plan === "FREE") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-800">Free Tier Usage:</span>
          <span>
            {billsThisMonth} / {billLimit} bills this month ({percentageUsed}%)
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">{remainingBills} remaining</span>
        </div>
        <Link
          href="/subscription"
          className="text-blue-600 hover:text-blue-700 font-semibold hover:underline flex items-center gap-1"
        >
          Upgrade to Basic (500 bills) &rarr;
        </Link>
      </div>
    );
  }

  return null;
}
