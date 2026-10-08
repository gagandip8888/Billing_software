import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { getTenantSubscription } from "@/lib/subscription";
import { getRazorpayKeyId, isRazorpayConfigured } from "@/lib/razorpay";
import { PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const subscription = await getTenantSubscription(tenant.id);

    return NextResponse.json({
      subscription,
      plans: PLANS,
      razorpay: {
        isConfigured: isRazorpayConfigured(),
        keyId: getRazorpayKeyId(),
      },
    });
  } catch (error: any) {
    console.error("GET /api/subscription error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to fetch subscription" },
      { status: 500 }
    );
  }
}
