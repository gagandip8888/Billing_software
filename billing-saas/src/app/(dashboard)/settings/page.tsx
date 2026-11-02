import React from "react";
import { redirect } from "next/navigation";
import { requireTenant, getSessionUser } from "@/lib/tenant";
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
  const sessionUser = await getSessionUser();

  // Strict Permission Guard: Employees/Cashiers cannot view or modify shop settings
  if (sessionUser?.role === "CASHIER") {
    redirect("/billing/new");
  }

  const tenant = await requireTenant();
  const [subscription, setting, staffUsers] = await Promise.all([
    getTenantSubscription(tenant.id),
    prisma.setting.findUnique({
      where: { tenantId: tenant.id },
    }),
    prisma.user.findMany({
      where: { tenantId: tenant.id },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    }),
  ]);
  const initialTab = searchParams?.tab || "payment";

  // Serialize dates for client component
  const initialStaff = staffUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Shop Settings</h1>
        <p className="text-sm text-slate-500">
          Configure UPI scanner, staff employee logins, language preferences, GSTIN, and printer formats
        </p>
      </div>

      <SettingsClient
        tenant={tenant}
        setting={setting}
        subscription={subscription}
        isRazorpayConfigured={isRazorpayConfigured()}
        razorpayKeyId={getRazorpayKeyId()}
        initialTab={initialTab}
        initialStaff={initialStaff}
      />
    </div>
  );
}
