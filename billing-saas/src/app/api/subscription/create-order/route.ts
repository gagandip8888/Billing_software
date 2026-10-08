import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { PLANS, PlanId } from "@/lib/plans";
import { getRazorpayClient, isRazorpayConfigured, getRazorpayKeyId } from "@/lib/razorpay";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createOrderSchema = z.object({
  planId: z.enum(["BASIC", "PRO", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan or billing cycle", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { planId, billingCycle } = parsed.data;
    const plan = PLANS[planId as PlanId];

    if (!plan || plan.price <= 0) {
      return NextResponse.json(
        { error: "Selected plan does not require online payment" },
        { status: 400 }
      );
    }

    const amountInInr = billingCycle === "yearly" ? plan.priceYearly : plan.price;
    const amountInPaise = Math.round(amountInInr * 100);

    // Check if Razorpay keys are configured
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          error:
            "Razorpay gateway is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local",
          code: "RAZORPAY_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const razorpay = getRazorpayClient();
    const shortTenant = tenant.id.slice(-6);
    const timestamp = Date.now().toString().slice(-6);
    const receipt = `sub_${shortTenant}_${timestamp}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        tenantId: tenant.id,
        planId,
        billingCycle,
        businessName: tenant.businessName,
        ownerMobile: tenant.mobile,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: getRazorpayKeyId(),
      planId,
      planName: plan.name,
      billingCycle,
      businessName: tenant.businessName,
      customerMobile: tenant.mobile,
      customerEmail: tenant.email,
    });
  } catch (error: any) {
    console.error("POST /api/subscription/create-order error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.error?.description || error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}
