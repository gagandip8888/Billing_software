import React from "react";
import { redirect } from "next/navigation";
import { requireTenant, getSessionUser } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
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
  // Fast parallel queries: fetch only settings and staff list
  const [setting, staffUsers] = await Promise.all([
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
        employeeId: true,
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
          Configure UPI scanner, edit shop name and profile, manage employee logins, and print formats
        </p>
      </div>

      <SettingsClient
        tenant={tenant}
        setting={setting}
        initialTab={initialTab}
        initialStaff={initialStaff}
      />
    </div>
  );
}
