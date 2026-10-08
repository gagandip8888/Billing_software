"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Zap,
  Sparkles,
  Shield,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Clock,
  Receipt,
  Users,
  CheckCircle2,
  Info,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { PLANS, PlanId, PlanConfig } from "@/lib/plans";
import { SubscriptionStatus } from "@/lib/subscription";
import { loadRazorpayScript } from "@/lib/razorpay-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SubscriptionPlansProps {
  initialStatus: SubscriptionStatus;
  isRazorpayConfigured?: boolean;
  razorpayKeyId?: string;
  onPlanChanged?: () => void;
}

export function SubscriptionPlans({
  initialStatus,
  isRazorpayConfigured = false,
  razorpayKeyId = "",
  onPlanChanged,
}: SubscriptionPlansProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus>(initialStatus);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [devUpgrading, setDevUpgrading] = useState(false);

  const currentPlanId = status.plan;
  const isPaidPlan = currentPlanId !== "FREE";
  const { billsThisMonth, billLimit, remainingBills, percentageUsed, userCount, userLimit } =
    status.usage;

  // Refresh status from API
  async function refreshStatus() {
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          setStatus(data.subscription);
        }
      }
    } catch (e) {
      console.error("Failed to refresh subscription status:", e);
    }
    if (onPlanChanged) onPlanChanged();
    router.refresh();
  }

  // Handle plan upgrade via Razorpay Checkout
  async function handleUpgrade(planId: PlanId) {
    if (planId === currentPlanId) return;

    if (planId === "FREE") {
      // Downgrade to Free
      handleDevUpgrade("FREE");
      return;
    }

    setLoadingPlan(planId);

    try {
      // 1. Create order on server
      const orderRes = await fetch("/api/subscription/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingCycle }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        if (orderData.code === "RAZORPAY_NOT_CONFIGURED") {
          toast.error("Razorpay is not yet configured in .env.local", {
            description: "You can use Dev Mode below to simulate plan changes.",
            duration: 6000,
          });
          setLoadingPlan(null);
          return;
        }
        throw new Error(orderData.error || "Failed to create order");
      }

      // 2. Load Razorpay Checkout script dynamically
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay payment SDK. Check your internet connection.");
      }

      // 3. Launch Razorpay Checkout Modal
      const options = {
        key: orderData.keyId || razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "BillingSaaS India",
        description: `${orderData.planName} Plan (${billingCycle === "yearly" ? "Annual" : "Monthly"})`,
        image: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          toast.loading("Verifying payment...", { id: "razorpay-verify" });
          try {
            const verifyRes = await fetch("/api/subscription/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                planId,
                billingCycle,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Verification failed");
            }

            toast.success(`🎉 Upgraded to ${PLANS[planId].name} Plan!`, {
              id: "razorpay-verify",
              description: `Your subscription is active until ${new Date(Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000).toLocaleDateString("en-IN")}`,
              duration: 6000,
            });

            await refreshStatus();
          } catch (err: any) {
            toast.error(err.message || "Payment verification failed", {
              id: "razorpay-verify",
            });
          } finally {
            setLoadingPlan(null);
          }
        },
        prefill: {
          name: orderData.businessName,
          contact: orderData.customerMobile,
          email: orderData.customerEmail,
        },
        notes: {
          planId,
          billingCycle,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setLoadingPlan(null);
            toast.info("Payment cancelled.");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        toast.error(`Payment failed: ${response.error?.description || "Transaction declined"}`);
        setLoadingPlan(null);
      });
      razorpay.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to initiate payment");
      setLoadingPlan(null);
    }
  }

  // Developer simulation upgrade (for test environments or missing keys)
  async function handleDevUpgrade(targetPlanId: PlanId) {
    setDevUpgrading(true);
    setLoadingPlan(targetPlanId);
    try {
      const res = await fetch("/api/subscription/dev-upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: targetPlanId,
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to switch plan");
      }

      toast.success(data.message || `Switched to ${targetPlanId} plan`);
      await refreshStatus();
    } catch (e: any) {
      toast.error(e.message || "Dev upgrade failed");
    } finally {
      setDevUpgrading(false);
      setLoadingPlan(null);
    }
  }

  // Usage progress color
  const getProgressColor = () => {
    if (percentageUsed >= 95) return "bg-rose-500";
    if (percentageUsed >= 80) return "bg-amber-500";
    return "bg-blue-600";
  };

  return (
    <div className="space-y-8">
      {/* Active Subscription Summary Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-blue-50/70 blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Subscription
              </span>
              <Badge
                className={
                  currentPlanId === "ENTERPRISE"
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : currentPlanId === "PRO"
                    ? "bg-purple-100 text-purple-800 border-purple-300"
                    : currentPlanId === "BASIC"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-slate-100 text-slate-700 border-slate-300"
                }
                variant="outline"
              >
                {status.planConfig.name} Plan
              </Badge>
              <Badge
                variant="outline"
                className={
                  status.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5 inline-block" />
                {status.status.toUpperCase()}
              </Badge>
            </div>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {status.businessName}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isPaidPlan && status.planExpiry
                ? `Plan active until ${new Date(status.planExpiry).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })} (${status.daysRemaining} days remaining)`
                : "Free Tier • Limited to 50 bills per month"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {currentPlanId !== "ENTERPRISE" && (
              <Button
                onClick={() => handleUpgrade("BASIC")}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 font-semibold"
              >
                <Zap className="h-4 w-4 mr-1.5" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </div>

        {/* Real-time Usage Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Monthly Bills Usage */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-blue-600" />
                Bills Generated This Month
              </span>
              <span className="font-bold text-slate-900">
                {billsThisMonth} / {billLimit === -1 ? "∞" : billLimit}
              </span>
            </div>

            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
                style={{ width: `${billLimit === -1 ? 100 : percentageUsed}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>{percentageUsed}% used</span>
              <span>
                {billLimit === -1
                  ? "Unlimited bills"
                  : remainingBills !== null && remainingBills > 0
                  ? `${remainingBills} bills left`
                  : "Limit reached!"}
              </span>
            </div>
          </div>

          {/* User Limits */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-indigo-600" />
                Staff Users
              </span>
              <span className="font-bold text-slate-900">
                {userCount} / {userLimit === -1 ? "∞" : userLimit}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{
                  width: `${
                    userLimit === -1 ? 100 : Math.min(100, Math.round((userCount / userLimit) * 100))
                  }%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Active logins</span>
              <span>{userLimit === -1 ? "Unlimited team" : `${userLimit - userCount} available`}</span>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col justify-between">
            <div className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Included Capabilities
            </div>
            <p className="text-xs text-slate-600">
              {currentPlanId === "FREE" && "Basic A4 invoicing, WhatsApp manual share, 1 user"}
              {currentPlanId === "BASIC" && "Thermal 80mm print, GST reports, customer ledger, 500 bills"}
              {currentPlanId === "PRO" && "Stock control, multi-branch, WhatsApp auto-send, 2000 bills"}
              {currentPlanId === "ENTERPRISE" && "Unlimited bills, custom templates, dedicated SLA"}
            </p>
            <div className="text-[11px] text-blue-600 font-medium mt-2 flex items-center gap-1">
              Razorpay Secured Checkout 🇮🇳
            </div>
          </div>
        </div>
      </div>

      {/* Developer / Missing Keys Banner */}
      {!isRazorpayConfigured && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-900">
                Razorpay Test Keys Pending in .env.local
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Add <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">RAZORPAY_KEY_ID</code> and{" "}
                <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-mono">RAZORPAY_KEY_SECRET</code> from your Razorpay Dashboard.
                In the meantime, use the &ldquo;Dev Instant Switch&rdquo; buttons below to test plan limits and features.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <span className="text-xs font-semibold text-amber-800 whitespace-nowrap">Dev Switch:</span>
            {(["FREE", "BASIC", "PRO", "ENTERPRISE"] as PlanId[]).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={currentPlanId === p ? "default" : "outline"}
                disabled={devUpgrading}
                onClick={() => handleDevUpgrade(p)}
                className={`text-xs h-7 px-2.5 ${
                  currentPlanId === p ? "bg-amber-700 text-white" : "border-amber-300 text-amber-800 hover:bg-amber-100"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Header & Billing Cycle Toggle */}
      <div className="text-center max-w-2xl mx-auto pt-4">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Choose the Perfect Plan for Your Business
        </h2>
        <p className="text-sm text-slate-500 mt-1.5">
          Transparent pricing designed for small retailers and growing shops across India.
        </p>

        {/* Toggle Switch */}
        <div className="mt-6 inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
              billingCycle === "monthly"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              billingCycle === "yearly"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Annual Billing
            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-black bg-emerald-500 text-white tracking-wide">
              2 MONTHS FREE
            </span>
          </button>
        </div>
      </div>

      {/* 4 Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.keys(PLANS) as PlanId[]).map((planKey) => {
          const plan = PLANS[planKey];
          const isCurrent = currentPlanId === planKey;
          const isPopular = plan.popular;
          const displayPrice = billingCycle === "yearly" ? plan.priceYearly : plan.price;
          const monthlyEquivalent =
            billingCycle === "yearly" && plan.priceYearly > 0
              ? Math.round(plan.priceYearly / 12)
              : plan.price;

          return (
            <div
              key={planKey}
              className={`relative rounded-2xl flex flex-col justify-between transition-all duration-300 border ${
                isPopular
                  ? "border-blue-600 ring-2 ring-blue-600/20 bg-white shadow-lg shadow-blue-500/10"
                  : isCurrent
                  ? "border-slate-400 bg-white shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              } p-6`}
            >
              {/* Most Popular Badge */}
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-600 text-white shadow-md shadow-blue-500/30">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      planKey === "ENTERPRISE"
                        ? "bg-amber-100 text-amber-800"
                        : planKey === "PRO"
                        ? "bg-purple-100 text-purple-800"
                        : planKey === "BASIC"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active
                    </span>
                  )}
                </div>

                {/* Price Display */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900 tracking-tight">
                      ₹{displayPrice}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      /{billingCycle === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && plan.price > 0 && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                      ₹{monthlyEquivalent}/mo • Save ₹{plan.price * 12 - plan.priceYearly}/year
                    </p>
                  )}
                </div>

                {/* Plan Limits Highlight */}
                <div className="space-y-2 py-3 border-y border-slate-100 mb-5 text-xs">
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span>Monthly Bills</span>
                    <span className="font-bold text-slate-900">
                      {plan.billLimit === -1 ? "Unlimited" : `${plan.billLimit} bills/mo`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-700 font-medium">
                    <span>Staff Users</span>
                    <span className="font-bold text-slate-900">
                      {plan.userLimit === -1 ? "Unlimited" : `${plan.userLimit} user${plan.userLimit > 1 ? "s" : ""}`}
                    </span>
                  </div>
                </div>

                {/* Feature List */}
                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                {isCurrent ? (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full font-bold text-xs bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed"
                  >
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleUpgrade(planKey)}
                    disabled={loadingPlan === planKey}
                    className={`w-full font-bold text-xs shadow-sm transition ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20"
                        : planKey === "ENTERPRISE"
                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                        : planKey === "PRO"
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {loadingPlan === planKey ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      <>
                        {planKey === "FREE" ? "Switch to Free" : `Upgrade - ₹${displayPrice}`}
                        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription Invoicing & Billing Details */}
      {status.subscriptionRecord && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Payment & Transaction Details</h3>
              <p className="text-xs text-slate-500">Record of current active Razorpay billing cycle</p>
            </div>
            <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700">
              Razorpay Verified
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">Status</span>
              <span className="font-bold text-slate-900 capitalize">
                {status.subscriptionRecord.status}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Amount Paid</span>
              <span className="font-bold text-slate-900">
                ₹{status.subscriptionRecord.amount || 0}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Activated On</span>
              <span className="font-medium text-slate-900">
                {new Date(status.subscriptionRecord.startDate).toLocaleDateString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Expires On</span>
              <span className="font-medium text-slate-900">
                {status.subscriptionRecord.endDate
                  ? new Date(status.subscriptionRecord.endDate).toLocaleDateString("en-IN")
                  : "Never (Free Plan)"}
              </span>
            </div>
            {status.subscriptionRecord.razorpayPayId && (
              <div className="col-span-2">
                <span className="text-slate-500 block">Razorpay Payment ID</span>
                <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {status.subscriptionRecord.razorpayPayId}
                </span>
              </div>
            )}
            {status.subscriptionRecord.razorpayOrderId && (
              <div className="col-span-2">
                <span className="text-slate-500 block">Razorpay Order ID</span>
                <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {status.subscriptionRecord.razorpayOrderId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trust & Guarantee Banner */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            ₹
          </div>
          <div>
            <p className="font-bold text-slate-800">100% Secure Payments via Razorpay</p>
            <p className="text-[11px] text-slate-500">
              UPI, Google Pay, PhonePe, Paytm, RuPay, Visa, Mastercard, NetBanking & EMI accepted.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>Instant Activation</span>
          <span>•</span>
          <span>GST Invoices Provided</span>
          <span>•</span>
          <span>Cancel Anytime</span>
        </div>
      </div>
    </div>
  );
}
