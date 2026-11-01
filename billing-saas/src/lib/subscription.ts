import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { PLANS, PlanId, PlanConfig, getPlan } from "@/lib/plans";
import { startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import { Plan } from "@prisma/client";

export interface SubscriptionStatus {
  tenantId: string;
  businessName: string;
  plan: PlanId;
  planConfig: PlanConfig;
  status: "active" | "expired" | "trial" | "cancelled";
  isExpired: boolean;
  planExpiry: Date | null;
  daysRemaining: number | null;
  usage: {
    billsThisMonth: number;
    billLimit: number;
    remainingBills: number | null;
    percentageUsed: number;
    canCreateBill: boolean;
    userCount: number;
    userLimit: number;
    canAddUser: boolean;
  };
  subscriptionRecord: {
    id: string;
    status: string;
    startDate: Date;
    endDate: Date | null;
    amount: number | null;
    razorpayOrderId: string | null;
    razorpayPayId: string | null;
  } | null;
}

/**
 * Fetch full subscription status, bill limits, and usage metrics for a tenant
 */
export const getTenantSubscription = cache(
  async (tenantId: string): Promise<SubscriptionStatus> => {
  const [tenant, subscription, userCount] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        businessName: true,
        plan: true,
        planExpiry: true,
      },
    }),
    prisma.subscription.findUnique({
      where: { tenantId },
    }),
    prisma.user.count({
      where: { tenantId, isActive: true },
    }),
  ]);

  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found`);
  }

  const now = new Date();
  const isPaidPlan = tenant.plan !== "FREE";
  const isExpired =
    isPaidPlan && tenant.planExpiry ? tenant.planExpiry.getTime() <= now.getTime() : false;

  // If expired, revert active capabilities to FREE
  const effectivePlan: PlanId = isExpired ? "FREE" : (tenant.plan as PlanId);
  const planConfig = getPlan(effectivePlan);

  // Calculate days remaining
  let daysRemaining: number | null = null;
  if (tenant.planExpiry && isPaidPlan) {
    daysRemaining = Math.max(0, differenceInDays(tenant.planExpiry, now));
  }

  // Count bills in the current calendar month
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const billsThisMonth = await prisma.invoice.count({
    where: {
      tenantId,
      invoiceDate: {
        gte: monthStart,
        lte: monthEnd,
      },
      status: { not: "CANCELLED" },
    },
  });

  const isUnlimitedBills = planConfig.billLimit === -1;
  const canCreateBill = isUnlimitedBills || billsThisMonth < planConfig.billLimit;
  const remainingBills = isUnlimitedBills
    ? null
    : Math.max(0, planConfig.billLimit - billsThisMonth);
  const percentageUsed = isUnlimitedBills
    ? 0
    : Math.min(100, Math.round((billsThisMonth / planConfig.billLimit) * 100));

  const isUnlimitedUsers = planConfig.userLimit === -1;
  const canAddUser = isUnlimitedUsers || userCount < planConfig.userLimit;

  let computedStatus: "active" | "expired" | "trial" | "cancelled" = "active";
  if (isExpired) {
    computedStatus = "expired";
  } else if (subscription?.status === "cancelled") {
    computedStatus = "cancelled";
  }

  return {
    tenantId: tenant.id,
    businessName: tenant.businessName,
    plan: effectivePlan,
    planConfig,
    status: computedStatus,
    isExpired,
    planExpiry: tenant.planExpiry,
    daysRemaining,
    usage: {
      billsThisMonth,
      billLimit: planConfig.billLimit,
      remainingBills,
      percentageUsed,
      canCreateBill,
      userCount,
      userLimit: planConfig.userLimit,
      canAddUser,
    },
    subscriptionRecord: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          amount: subscription.amount ? Number(subscription.amount) : null,
          razorpayOrderId: subscription.razorpayOrderId,
          razorpayPayId: subscription.razorpayPayId,
        }
      : null,
  };
});

/**
 * Check if the tenant is allowed to create another bill right now
 */
export async function checkCanCreateBill(tenantId: string): Promise<{
  allowed: boolean;
  billsThisMonth: number;
  billLimit: number;
  plan: PlanId;
  reason?: string;
}> {
  const status = await getTenantSubscription(tenantId);

  if (!status.usage.canCreateBill) {
    return {
      allowed: false,
      billsThisMonth: status.usage.billsThisMonth,
      billLimit: status.usage.billLimit,
      plan: status.plan,
      reason: `You have reached the monthly limit of ${status.usage.billLimit} bills on the ${status.planConfig.name} plan. Upgrade your plan to continue billing.`,
    };
  }

  return {
    allowed: true,
    billsThisMonth: status.usage.billsThisMonth,
    billLimit: status.usage.billLimit,
    plan: status.plan,
  };
}

/**
 * Activate or update a tenant's subscription plan following a verified payment
 */
export async function activateTenantPlan({
  tenantId,
  plan,
  billingCycle,
  razorpayOrderId,
  razorpayPayId,
  amount,
}: {
  tenantId: string;
  plan: PlanId;
  billingCycle: "monthly" | "yearly";
  razorpayOrderId?: string;
  razorpayPayId?: string;
  amount: number;
}): Promise<void> {
  const now = new Date();
  const endDate = new Date(now);

  if (billingCycle === "yearly") {
    endDate.setDate(endDate.getDate() + 365);
  } else {
    endDate.setDate(endDate.getDate() + 30);
  }

  const prismaPlan = plan as Plan;

  await prisma.$transaction([
    // Update Tenant
    prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: prismaPlan,
        planExpiry: endDate,
      },
    }),
    // Upsert Subscription
    prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        plan: prismaPlan,
        status: "active",
        startDate: now,
        endDate,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPayId: razorpayPayId || null,
        amount,
      },
      update: {
        plan: prismaPlan,
        status: "active",
        startDate: now,
        endDate,
        razorpayOrderId: razorpayOrderId || null,
        razorpayPayId: razorpayPayId || null,
        amount,
      },
    }),
  ]);
}
