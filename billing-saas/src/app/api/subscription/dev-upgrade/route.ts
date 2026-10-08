import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/tenant";
import { PLANS, PlanId } from "@/lib/plans";
import { activateTenantPlan } from "@/lib/subscription";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const devUpgradeSchema = z.object({
  planId: z.enum(["FREE", "BASIC", "PRO", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export async function POST(req: NextRequest) {
  try {
    const tenant = await requireTenant();
    const body = await req.json();

    const parsed = devUpgradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid plan or billing cycle", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { planId, billingCycle } = parsed.data;

    if (planId === "FREE") {
      // Revert to FREE
      await prisma.$transaction([
        prisma.tenant.update({
          where: { id: tenant.id },
          data: {
            plan: "FREE",
            planExpiry: null,
          },
        }),
        prisma.subscription.upsert({
          where: { tenantId: tenant.id },
          create: {
            tenantId: tenant.id,
            plan: "FREE",
            status: "active",
            startDate: new Date(),
            endDate: null,
            amount: 0,
          },
          update: {
            plan: "FREE",
            status: "active",
            endDate: null,
            amount: 0,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: "Switched to Free plan.",
        plan: "FREE",
      });
    }

    const plan = PLANS[planId as PlanId];
    const amount = billingCycle === "yearly" ? plan.priceYearly : plan.price;
    const mockOrderId = `order_dev_${Date.now().toString(36)}`;
    const mockPayId = `pay_dev_${Date.now().toString(36)}`;

    await activateTenantPlan({
      tenantId: tenant.id,
      plan: planId as PlanId,
      billingCycle,
      razorpayOrderId: mockOrderId,
      razorpayPayId: mockPayId,
      amount,
    });

    return NextResponse.json({
      success: true,
      message: `[Dev Mode] Successfully simulated upgrade to ${plan.name} plan!`,
      plan: planId,
      billingCycle,
    });
  } catch (error: any) {
    console.error("POST /api/subscription/dev-upgrade error:", error);
    if (error?.message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error?.message || "Failed to update plan" },
      { status: 500 }
    );
  }
}
