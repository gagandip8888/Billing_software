import React from "react";
import { requireTenant } from "@/lib/tenant";
import { getTenantSubscription } from "@/lib/subscription";
import { isRazorpayConfigured, getRazorpayKeyId } from "@/lib/razorpay";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tenant = await requireTenant();
  const subscription = await getTenantSubscription(tenant.id);
  const initialTab = searchParams?.tab || "profile";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop Settings</h1>
        <p className="text-sm text-slate-500">
          Configure your business profile, GSTIN, subscription plan, and printer formats
        </p>
      </div>

      <SettingsClient
        tenant={tenant}
        subscription={subscription}
        isRazorpayConfigured={isRazorpayConfigured()}
        razorpayKeyId={getRazorpayKeyId()}
        initialTab={initialTab}
      />
    </div>
  );
}
