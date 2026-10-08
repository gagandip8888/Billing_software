import React from "react";
import { requireTenant } from "@/lib/tenant";
import { getDateRange, DateRangePreset } from "@/lib/date-range";
import { generateReportsData } from "@/lib/reports";
import { ReportsClient } from "@/components/reports/ReportsClient";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: {
    preset?: string;
    from?: string;
    to?: string;
  };
}) {
  const tenant = await requireTenant();

  const preset = (searchParams?.preset || "thisMonth") as DateRangePreset;
  const customFrom = searchParams?.from ? new Date(searchParams.from) : undefined;
  const customTo = searchParams?.to ? new Date(searchParams.to) : undefined;

  const { from, to } = getDateRange(preset, customFrom, customTo);

  const initialData = await generateReportsData(tenant.id, from, to);

  return (
    <div className="max-w-7xl mx-auto">
      <ReportsClient initialData={initialData} initialPreset={preset} />
    </div>
  );
}
