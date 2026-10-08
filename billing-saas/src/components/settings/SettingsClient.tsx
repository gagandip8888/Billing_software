"use client";

import React, { useState } from "react";
import { Store, Printer, Bell, Shield, CreditCard, Building, Check, Sparkles } from "lucide-react";
import { SubscriptionPlans } from "@/components/subscription/SubscriptionPlans";
import { SubscriptionStatus } from "@/lib/subscription";

interface SettingsClientProps {
  tenant: any;
  subscription: SubscriptionStatus;
  isRazorpayConfigured: boolean;
  razorpayKeyId: string;
  initialTab?: string;
}

export function SettingsClient({
  tenant,
  subscription,
  isRazorpayConfigured,
  razorpayKeyId,
  initialTab = "profile",
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const tabs = [
    { id: "profile", label: "Shop Profile", icon: Store },
    { id: "subscription", label: "Plans & Subscription", icon: CreditCard, highlight: true },
    { id: "invoice", label: "Invoice & Print", icon: Printer },
    { id: "whatsapp", label: "WhatsApp & Alerts", icon: Bell },
    { id: "staff", label: "Staff & Security", icon: Shield },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 space-y-1 shadow-sm h-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition ${
                isActive
                  ? "bg-blue-50 text-blue-700 font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-slate-500"}`} />
                {tab.label}
              </div>
              {tab.id === "subscription" && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                  {subscription.plan}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <div className="md:col-span-3">
        {activeTab === "subscription" && (
          <div>
            <SubscriptionPlans
              initialStatus={subscription}
              isRazorpayConfigured={isRazorpayConfigured}
              razorpayKeyId={razorpayKeyId}
            />
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200 mb-4 flex items-center justify-between">
              <span>Shop Information</span>
              <span className="text-xs font-normal text-slate-500">ID: {tenant.id}</span>
            </h2>
            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  defaultValue={tenant.businessName}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Type</label>
                <input
                  type="text"
                  defaultValue={tenant.shopType.replace(/_/g, " ")}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-700 cursor-not-allowed uppercase"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Mobile
                </label>
                <input
                  type="text"
                  defaultValue={tenant.mobile}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  defaultValue={tenant.gstNo || "Not configured"}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <textarea
                  rows={3}
                  defaultValue={tenant.address || "Shop address, city, pin code"}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "invoice" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200 mb-4">
              Invoice & Thermal Print Settings
            </h2>
            <div className="space-y-4 max-w-xl text-sm text-slate-600">
              <p>
                Configure thermal receipt format (80mm / 58mm) and A4 standard GST invoice formats.
              </p>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                💡 Thermal printing is enabled for all <strong>Basic, Pro, and Enterprise</strong> plans.
              </div>
            </div>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200 mb-4">
              WhatsApp Cloud API Notifications
            </h2>
            <div className="space-y-4 max-w-xl text-sm text-slate-600">
              <p>
                Automatic WhatsApp billing notifications directly deliver invoice PDF links and payment reminders to customer phones.
              </p>
            </div>
          </div>
        )}

        {activeTab === "staff" && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-200 mb-4">
              Staff Accounts & Security
            </h2>
            <div className="space-y-4 max-w-xl text-sm text-slate-600">
              <p>
                Add cashier and manager logins with role-based restrictions.
              </p>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                Your current plan (<strong>{subscription.plan}</strong>) supports{" "}
                <strong>
                  {subscription.usage.userLimit === -1 ? "unlimited" : subscription.usage.userLimit}
                </strong>{" "}
                user seat(s).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
