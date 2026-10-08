import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { PLANS, PlanId } from "@/lib/plans";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { activateTenantPlan } from "@/lib/subscription";
import { z } from "zod";

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  razorpayOrderId: z.string().min(1, "Order ID is required"),
  razorpayPaymentId: z.string().min(1, "Payment ID is required"),
  razorpaySignature: z.string().min(1, "Signature is required"),
  planId: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payment verification data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      planId,
      billingCycle,
    } = parsed.data;

    // Verify signature with secret
    const isValid = verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json(
        { error: "Payment verification failed: Invalid signature" },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as PlanId];
    const amount = billingCycle === "yearly" ? plan.priceYearly : plan.price;

    // Update Tenant and Subscription records
    await activateTenantPlan({
      tenantId: tenant.id,
      plan: planId as PlanId,
      billingCycle,
      razorpayOrderId,
      razorpayPayId: razorpayPaymentId,
      amount,
    });

    return NextResponse.json({
      success: true,
      message: `Congratulations! Your plan has been upgraded to ${plan.name}.`,
      plan: planId,
      billingCycle,
    });
  } catch (error: any) {
    console.error("POST /api/subscription/verify error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Payment verification failed" },
      { status: 500 }
    );
  }
}
