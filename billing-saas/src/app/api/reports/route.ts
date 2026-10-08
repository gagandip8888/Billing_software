import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { getDateRange, DateRangePreset } from "@/lib/date-range";
import { generateReportsData } from "@/lib/reports";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const { searchParams } = new URL(req.url);

    const preset = (searchParams.get("preset") || "thisMonth") as DateRangePreset;
    const customFromStr = searchParams.get("from");
    const customToStr = searchParams.get("to");

    let customFrom: Date | undefined;
    let customTo: Date | undefined;

    if (customFromStr) {
      customFrom = new Date(customFromStr);
    }
    if (customToStr) {
      customTo = new Date(customToStr);
    }

    const { from, to } = getDateRange(preset, customFrom, customTo);

    const reportsData = await generateReportsData(tenant.id, from, to);

    return NextResponse.json({
      success: true,
      preset,
      reports: reportsData,
    });
  } catch (error: any) {
    console.error("GET /api/reports error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to generate reports" },
      { status: 500 }
    );
  }
}
