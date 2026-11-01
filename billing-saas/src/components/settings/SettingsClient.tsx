"use client";

import React, { useState } from "react";
import {
  Store,
  CreditCard,
  QrCode,
  Globe,
  Loader2,
  Save,
  Smartphone,
  Check,
  Lock,
  KeyRound,
  MapPin,
  Building,
  Eye,
  EyeOff,
} from "lucide-react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import { useLanguage } from "@/lib/language-context";
import { Language } from "@/lib/translations";
import { Button } from "@/components/ui/button";

interface SettingsClientProps {
  tenant: any;
  setting?: any;
  subscription?: any;
  isRazorpayConfigured?: boolean;
  razorpayKeyId?: string;
  initialTab?: string;
}

export function SettingsClient({
  tenant,
  setting,
  subscription,
  isRazorpayConfigured,
  razorpayKeyId,
  initialTab = "payment",
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const { language, setLanguage, t } = useLanguage();

  // Payment settings state
  const [preferredApp, setPreferredApp] = useState<string>(
    setting?.preferredApp || "PhonePe"
  );
  const [upiId, setUpiId] = useState<string>(setting?.upiId || "");
  const [bankName, setBankName] = useState<string>(setting?.bankName || "");
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Language settings state
  const [selectedLang, setSelectedLang] = useState<Language>(
    (setting?.language as Language) || language || "en"
  );
  const [isSavingLang, setIsSavingLang] = useState(false);

  // Shop profile & Security state
  const [deletePassword, setDeletePassword] = useState<string>(
    setting?.deletePassword || ""
  );
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [address, setAddress] = useState<string>(tenant?.address || "");
  const [city, setCity] = useState<string>(tenant?.city || "");
  const [pincode, setPincode] = useState<string>(tenant?.pincode || "");
  const [gstNo, setGstNo] = useState<string>(tenant?.gstNo || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // 3 Essential Tabs: Payment, Language, Shop Profile & Security
  const tabs = [
    { id: "payment", label: t("paymentSettings", "Payment Settings"), icon: QrCode, highlightBadge: "Dynamic QR" },
    { id: "language", label: t("languageSettings", "Language"), icon: Globe },
    { id: "profile", label: t("shopProfile", "Shop Profile"), icon: Store },
  ];

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingPayment(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferredApp,
          upiId: upiId.trim(),
          bankName: bankName.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save payment settings");
      }

      toast.success("Payment & UPI settings saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSavingPayment(false);
    }
  }

  async function handleSaveLanguage(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingLang(true);
    try {
      await setLanguage(selectedLang);
      toast.success(
        selectedLang === "mr"
          ? "भाषा मराठीमध्ये बदलली गेली!"
          : "Language switched to English!"
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to switch language");
    } finally {
      setIsSavingLang(false);
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deletePassword: deletePassword.trim(),
          address: address.trim(),
          city: city.trim(),
          pincode: pincode.trim(),
          gstNo: gstNo.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile settings");
      }

      toast.success("Shop Profile & Admin Delete Password updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Responsive Tabs (Vertical stack on mobile, sidebar on desktop) */}
      <div className="w-full lg:w-64 bg-white rounded-xl border border-slate-200 p-2 sm:p-2.5 shadow-sm shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition ${
                  isActive
                    ? "bg-purple-50 text-purple-700 font-bold border border-purple-200 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-purple-600" : "text-slate-500"}`} />
                  <span className="truncate">{tab.label}</span>
                </div>
                {tab.highlightBadge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0 ml-1.5">
                    {tab.highlightBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 w-full min-w-0">
        {/* 1. PAYMENT SETTINGS */}
        {activeTab === "payment" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("paymentSettings", "Payment Settings")}
                </h2>
                <p className="text-xs text-slate-500">
                  Configure store UPI ID and preferred payment app for instant POS QR billing.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5 shrink-0">
                <Smartphone className="h-3.5 w-3.5" /> Instant Pay
              </span>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-5 w-full max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t("preferredApp", "Preferred App")}
                </label>
                <select
                  value={preferredApp}
                  onChange={(e) => setPreferredApp(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="PhonePe">PhonePe</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Paytm">Paytm</option>
                  <option value="BHIM">BHIM</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  Default payment app recommended on receipts and invoice notifications.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>{t("upiId", "UPI ID")} <span className="text-red-500 font-bold">*</span></span>
                  <span className="text-[11px] font-normal text-slate-400">e.g. 9876543210@ybl, store@okaxis</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9876543210@ybl or store@okaxis"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Used in Billing screen to generate instant live QR codes for customer scanning.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {t("bankName", "Bank Name")} (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India, HDFC Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {upiId && (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg border border-purple-100 shrink-0">
                    <QRCode
                      value={`upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
                        tenant.businessName || "Store"
                      )}&cu=INR`}
                      size={90}
                      level="M"
                    />
                  </div>
                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-purple-900 block">Live UPI QR Code Preview</span>
                    <p className="text-slate-600 font-mono text-[11px]">UPI ID: {upiId}</p>
                    <p className="text-slate-600">Payee: {tenant.businessName}</p>
                    <p className="text-[11px] text-emerald-700 font-semibold">
                      ✓ Ready for Billing terminal & receipts
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSavingPayment}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-2 shadow-sm"
              >
                {isSavingPayment ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> {t("saveSettings", "Save Settings")}
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* 2. LANGUAGE SETTINGS */}
        {activeTab === "language" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900">
                {t("languageSettings", "Language")}
              </h2>
              <p className="text-xs text-slate-500">
                Select your preferred interface language. Choose between English and Marathi (मराठी).
              </p>
            </div>

            <form onSubmit={handleSaveLanguage} className="space-y-5 w-full max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t("selectLanguage", "Select Language")}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setSelectedLang("en")}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedLang === "en"
                        ? "border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-600 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <span className="block text-sm font-bold">English</span>
                      <span className="text-[11px] text-slate-500">Standard English interface</span>
                    </div>
                    {selectedLang === "en" && <Check className="h-4 w-4 text-purple-600 shrink-0" />}
                  </div>

                  <div
                    onClick={() => setSelectedLang("mr")}
                    className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      selectedLang === "mr"
                        ? "border-purple-600 bg-purple-50 text-purple-900 ring-1 ring-purple-600 font-bold"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div>
                      <span className="block text-sm font-bold">मराठी (Marathi)</span>
                      <span className="text-[11px] text-slate-500">स्थानिक भाषा इंटरफेस</span>
                    </div>
                    {selectedLang === "mr" && <Check className="h-4 w-4 text-purple-600 shrink-0" />}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800">Language Coverage / भाषा व्याप्ती:</span>
                <p>• Sidebar menu: डॅशबोर्ड, बिलिंग, बिले, उधारी, रिटर्न्स, खर्च, प्रॉडक्ट्स, ग्राहक, सेटिंग्ज</p>
                <p>• Dashboard cards: आजची विक्री, आजचा खर्च, आजचा नफा, आजचे ग्राहक, आजची उधारी</p>
                <p>• Billing form: ग्राहक माहिती, वस्तू आणि प्रॉडक्ट्स, पेमेंट पद्धत, बिल जतन करा</p>
              </div>

              <Button
                type="submit"
                disabled={isSavingLang}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-2 shadow-sm"
              >
                {isSavingLang ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Switching...
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" /> Apply Language Preference
                  </>
                )}
              </Button>
            </form>
          </div>
        )}

        {/* 3. SHOP PROFILE & SECURITY (With Delete Password & Address) */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {t("shopProfile", "Shop Profile")} & Security
                </h2>
                <p className="text-xs text-slate-500">
                  Manage store contact details, address for bills, and admin delete password.
                </p>
              </div>
              <span className="text-xs font-normal text-slate-400">ID: {tenant.id}</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 w-full max-w-2xl">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Shop / Business Name
                </label>
                <input
                  type="text"
                  defaultValue={tenant.businessName}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-700 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shop Type</label>
                  <input
                    type="text"
                    defaultValue={tenant.shopType.replace(/_/g, " ")}
                    disabled
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-700 cursor-not-allowed uppercase"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-700 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              {/* Editable Address for bills */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-purple-600" /> Shop Address (Printed on Bills)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shop No. 4, MG Road, Near City Mall"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Pune, Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="e.g. 411001"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  placeholder="e.g. 27AAAAA0000A1Z5 (Leave blank if unregistered)"
                  value={gstNo}
                  onChange={(e) => setGstNo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-800 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* BILL DELETE PASSWORD */}
              <div className="p-4 rounded-xl bg-red-50/70 border border-red-200 space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-900 font-bold text-xs sm:text-sm">
                    <KeyRound className="h-4 w-4 text-red-600" />
                    <span>{t("deletePassword", "Bill Delete Password")}</span>
                  </div>
                  {deletePassword ? (
                    <span className="text-[10px] bg-red-100 text-red-800 font-semibold px-2 py-0.5 rounded-full border border-red-200">
                      Protection Active
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                      Not Configured
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {t(
                    "deletePasswordDesc",
                    "Require admin password before deleting any invoice to prevent accidental or unauthorized bill deletion."
                  )}
                </p>
                <div className="relative pt-1">
                  <input
                    type={showDeletePassword ? "text" : "password"}
                    placeholder="Set admin password to authorize bill deletion"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-red-200 bg-white font-mono text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSavingProfile}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-9 px-4 rounded-lg flex items-center gap-2 shadow-sm mt-3"
              >
                {isSavingProfile ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("saving", "Saving...")}
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" /> {t("saveProfile", "Save Profile & Security")}
                  </>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
