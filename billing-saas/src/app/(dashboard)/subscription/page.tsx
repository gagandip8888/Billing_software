import React from "react";
import { requireTenant } from "@/lib/tenant";
import { getTenantSubscription } from "@/lib/subscription";
import { isRazorpayConfigured, getRazorpayKeyId } from "@/lib/razorpay";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { CreditCard, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SubscriptionPage() {
  const tenant = await requireTenant();
  const status = await getTenantSubscription(tenant.id);
  const razorpayConfigured = isRazorpayConfigured();
  const keyId = getRazorpayKeyId();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles className="h-3 w-3" />
            Plans & Billing
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-600" />
            Subscription & Limits
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store plan, monthly bill limits, staff seats, and Razorpay billing
          </p>
        </div>
      </div>

      {/* Main Subscription Interface */}
      <SubscriptionPlans
        initialStatus={status}
        isRazorpayConfigured={razorpayConfigured}
        razorpayKeyId={keyId}
      />
    </div>
  );
}
