import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { activateTenantPlan } from "@/lib/subscription";
import { PlanId, PLANS } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing x-razorpay-signature header" },
        { status: 400 }
      );
    }

    const isValid = verifyWebhookSignature({
      body: rawBody,
      signature,
    });

    if (!isValid) {
      console.warn("[Razorpay Webhook] Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    console.log(`[Razorpay Webhook] Processing event: ${eventType}`);

    if (eventType === "order.paid" || eventType === "payment.captured") {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const notes = orderEntity?.notes || paymentEntity?.notes || {};
      const tenantId = notes.tenantId;
      const planId = notes.planId as PlanId;
      const billingCycle = (notes.billingCycle as "monthly" | "yearly") || "monthly";

      if (tenantId && planId && PLANS[planId]) {
        const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;
        const razorpayPayId = paymentEntity?.id;
        const amountPaise = paymentEntity?.amount || orderEntity?.amount || 0;
        const amount = amountPaise / 100;

        await activateTenantPlan({
          tenantId,
          plan: planId,
          billingCycle,
          razorpayOrderId,
          razorpayPayId,
          amount,
        });

        console.log(
          `[Razorpay Webhook] Successfully activated plan ${planId} for tenant ${tenantId}`
        );
      }
    }

    return NextResponse.json({ status: "ok", received: true });
  } catch (error: any) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing error" },
      { status: 500 }
    );
  }
}
