import React from "react";
import { requireTenant } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
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
  const [subscription, setting] = await Promise.all([
    getTenantSubscription(tenant.id),
    prisma.setting.findUnique({
      where: { tenantId: tenant.id },
    }),
  ]);
  const initialTab = searchParams?.tab || "payment";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop Settings</h1>
        <p className="text-sm text-slate-500">
          Configure UPI scanner, language preferences, GSTIN, and printer formats
        </p>
      </div>

      <SettingsClient
        tenant={tenant}
        setting={setting}
        subscription={subscription}
        isRazorpayConfigured={isRazorpayConfigured()}
        razorpayKeyId={getRazorpayKeyId()}
        initialTab={initialTab}
      />
    </div>
  );
}
