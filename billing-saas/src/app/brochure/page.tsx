 "use client";

import React from "react";
import Link from "next/link";
import QRCode from "react-qr-code";
import {
  Receipt,
  Zap,
  BarChart3,
  BookOpen,
  Users,
  FileCheck2,
  WifiOff,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MessageCircle,
  FileSpreadsheet,
  Download,
  Phone,
  Mail,
  Globe,
  Sparkles,
  ShoppingBag,
  Store,
  Layers,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BrochurePage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const keyFeatures = [
    {
      icon: Zap,
      title: "Fast POS Billing",
      badge: "Thermal 58/80mm",
      description:
        "Lightning-fast counter billing in less than 3 seconds. Full barcode scanner support, keyboard shortcuts, and instant thermal receipt printing.",
      color: "from-amber-500/20 to-amber-500/5 text-amber-600 border-amber-200",
      iconColor: "text-amber-600 bg-amber-50",
    },
    {
      icon: BarChart3,
      title: "Live Owner Analytics",
      badge: "Real-time Sync",
      description:
        "Monitor your business anywhere from mobile or PC. Track daily sales, net profits, best-selling products, and live employee counter performance.",
      color: "from-indigo-500/20 to-indigo-500/5 text-indigo-600 border-indigo-200",
      iconColor: "text-indigo-600 bg-indigo-50",
    },
    {
      icon: BookOpen,
      title: "Udhari Khata (Credit)",
      badge: "WhatsApp Reminders",
      description:
        "Zero debt losses. Complete digital customer ledger with automatic balance calculations and 1-click WhatsApp payment reminders with UPI QR codes.",
      color: "from-rose-500/20 to-rose-500/5 text-rose-600 border-rose-200",
      iconColor: "text-rose-600 bg-rose-50",
    },
    {
      icon: Users,
      title: "Staff & Role Control",
      badge: "Cashier Guards",
      description:
        "Individual staff logins with Employee IDs. Cashiers can only bill and return goods; business profits, shop settings, and deletion remain strictly owner-only.",
      color: "from-purple-500/20 to-purple-500/5 text-purple-600 border-purple-200",
      iconColor: "text-purple-600 bg-purple-50",
    },
    {
      icon: FileCheck2,
      title: "GST Ready & Returns",
      badge: "Credit Notes",
      description:
        "Automatic CGST/SGST split, HSN code support, and seamless Sales Returns. Returns automatically restore product inventory stock and issue credit notes.",
      color: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 border-emerald-200",
      iconColor: "text-emerald-600 bg-emerald-50",
    },
    {
      icon: WifiOff,
      title: "Offline Mode (PWA)",
      badge: "100% Reliable",
      description:
        "Never stop billing even when your internet drops or WiFi disconnects. Bills are saved securely on device and auto-sync to the cloud once back online.",
      color: "from-cyan-500/20 to-cyan-500/5 text-cyan-600 border-cyan-200",
      iconColor: "text-cyan-600 bg-cyan-50",
    },
  ];

  const businessTypes = [
    "Clothing & Fashion Stores",
    "Kirana & Supermarkets",
    "Footwear & Shoes Outlets",
    "Electronics & Mobile Shops",
    "Hardware & Sanitaryware",
    "Gifts, Toys & Stationery",
  ];

  const advantages = [
    {
      title: "Zero Hardware Lock-in",
      desc: "Runs smoothly on your existing Laptop, PC, Tablet, or Android phone. Works with standard USB/Bluetooth thermal and laser printers.",
      icon: Smartphone,
    },
    {
      title: "Instant WhatsApp Invoicing",
      desc: "Save thousands on thermal paper rolls every month. Share clean, branded PDF bills directly to customer WhatsApp in 1 click.",
      icon: MessageCircle,
    },
    {
      title: "Bulk Excel Product Import",
      desc: "Upload 10,000+ items with MRP, purchase rates, barcodes, and stock quantities within 10 seconds using bulk import.",
      icon: FileSpreadsheet,
    },
    {
      title: "Bank-Grade Cloud Security",
      desc: "Encrypted PostgreSQL database with daily automated cloud backups. Never lose your business sales and ledger data again.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans print:bg-white print:text-black">
      {/* Sleek Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-3 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-xs">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight">Billing<span className="text-emerald-400">SaaS</span></span>
              <span className="text-xs text-slate-400 ml-2 font-medium hidden sm:inline">
                Modern Retail Billing Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-xs border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              <Link href="/login">Login</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
            >
              <Link href="/register">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Brochure Container (Styled for A4 standard page preview) */}
      <div className="max-w-[210mm] mx-auto my-6 sm:my-10 bg-white shadow-2xl border border-slate-200 rounded-2xl overflow-hidden print:m-0 print:border-none print:shadow-none print:rounded-none print:max-w-none">
        
        {/* ========================================================= */}
        {/* SECTION 1: HEADER & HERO BANNER */}
        {/* ========================================================= */}
        <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 text-white p-8 sm:p-12 overflow-hidden print:p-8">
          {/* Subtle Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Bar Branding */}
          <div className="flex items-center justify-between pb-8 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-md">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight leading-none">
                  Billing<span className="text-emerald-400">SaaS</span>
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 mt-1">
                  Cloud POS & Retail ERP &bull; Made for India 🇮🇳
                </div>
              </div>
            </div>

            <div className="text-right">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[11px] font-bold px-3 py-1">
                ⭐ Trusted by 5,000+ Retailers
              </Badge>
              <div className="text-[11px] text-slate-400 mt-1">
                GST Ready &bull; Cloud Backup
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="pt-8 sm:pt-10 space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" /> Fast &bull; Simple &bull; Modern POS
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              Smart Billing Software for Modern Indian Shops
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Supercharge your retail business with <strong>3-second POS billing</strong>, instant <strong>WhatsApp receipts</strong>, real-time <strong>owner sales tracking</strong>, and automatic <strong>Udhari (Khata) debt recovery</strong>.
            </p>

            {/* Hero Highlights Pill Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="font-extrabold text-emerald-400 text-base">3 Sec</div>
                <div className="text-[11px] text-slate-300">Fast Billing</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="font-extrabold text-indigo-300 text-base">₹0 Cost</div>
                <div className="text-[11px] text-slate-300">Existing Hardware</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="font-extrabold text-purple-300 text-base">100%</div>
                <div className="text-[11px] text-slate-300">GST & Returns</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                <div className="font-extrabold text-amber-400 text-base">Offline</div>
                <div className="text-[11px] text-slate-300">Continuous Billing</div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: 6 CORE PILLARS (KEY FEATURES GRID) */}
        {/* ========================================================= */}
        <div className="p-8 sm:p-10 space-y-6 bg-slate-50 border-b border-slate-200">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Powerful Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Everything Your Shop Needs to Grow Faster
            </h2>
            <p className="text-xs text-slate-500">
              Built specifically to eliminate billing queues, recover pending customer credit, and secure your profits.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {keyFeatures.map((feat, idx) => {
              const IconComp = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2.5 hover:border-indigo-300 transition break-inside-avoid"
                >
                  <div className="flex items-center justify-between">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${feat.iconColor} shadow-2xs`}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-bold ${feat.color}`}>
                      {feat.badge}
                    </Badge>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 3: BUSINESS SUITABILITY */}
        {/* ========================================================= */}
        <div className="px-8 sm:px-10 py-6 bg-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
              Designed For Every Retail Category
            </span>
            <h3 className="text-lg font-bold">Perfect Fit for Indian Retail Stores</h3>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {businessTypes.map((type, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 font-semibold text-slate-200 text-[11px]"
              >
                &bull; {type}
              </span>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 4: WHY CHOOSE BILLING SAAS (ADVANTAGES) */}
        {/* ========================================================= */}
        <div className="p-8 sm:p-10 space-y-6 bg-white border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                Competitive Edge
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                Why Indian Shop Owners Choose BillingSaaS
              </h2>
            </div>
            <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5 self-start sm:self-auto">
              <CheckCircle2 className="h-4 w-4" /> 100% Data Ownership & Daily Backups
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {advantages.map((adv, idx) => {
              const AdvIcon = adv.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start gap-3.5 break-inside-avoid"
                >
                  <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AdvIcon className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-900">{adv.title}</h3>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{adv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 5: SPECIAL PRICING / LAUNCH OFFER */}
        {/* ========================================================= */}
        <div className="p-8 sm:p-10 bg-gradient-to-br from-slate-900 to-indigo-950 text-white relative overflow-hidden">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <Badge className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-0.5">
              🎉 SPECIAL LAUNCH OFFER
            </Badge>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Get 30 Days Free Pro Trial &bull; No Credit Card Needed
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Experience the fastest billing software with full access to WhatsApp bills, staff accounts, and real-time analytics. Free setup assistance included!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 text-left max-w-lg mx-auto">
              {/* Starter Plan */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400">Starter Counter</span>
                <div className="text-2xl font-black text-white">₹0 <span className="text-xs font-normal text-slate-400">/ forever</span></div>
                <p className="text-[11px] text-slate-300">50 bills/month &bull; Thermal print &bull; Offline billing</p>
              </div>

              {/* Pro Retail Plan */}
              <div className="p-4 rounded-xl bg-indigo-600/30 border border-indigo-400/40 space-y-2 relative">
                <span className="absolute top-3 right-3 text-[9px] uppercase font-black px-2 py-0.5 rounded bg-emerald-400 text-slate-950">
                  Most Popular
                </span>
                <span className="text-[10px] uppercase font-bold text-indigo-300">Pro Retailer</span>
                <div className="text-2xl font-black text-white">₹599 <span className="text-xs font-normal text-slate-400">/ month</span></div>
                <p className="text-[11px] text-slate-200">Unlimited bills &bull; WhatsApp bills &bull; Staff logins</p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 6: FOOTER & CONTACT DETAILS WITH QR CODE */}
        {/* ========================================================= */}
        <div className="p-6 sm:p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Contact Details */}
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <div className="h-7 w-7 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                <Receipt className="h-3.5 w-3.5" />
              </div>
              <span className="font-extrabold text-base text-slate-900">
                Billing<span className="text-indigo-600">SaaS</span> Technologies
              </span>
            </div>

            <p className="text-xs text-slate-500 max-w-sm">
              Headquartered in Mumbai &bull; Supporting thousands of retail counters across India.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-semibold text-slate-700 pt-1">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <Phone className="h-3.5 w-3.5" /> +91 98765 43210
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> support@billingsaas.in
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" /> www.billingsaas.in
              </span>
            </div>
          </div>

          {/* QR Code for Instant Demo / Website Access */}
          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
            <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-2xs w-[80px] h-[80px] flex items-center justify-center">
              {mounted ? (
                <QRCode
                  value="https://billingsaas.in/demo"
                  size={68}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox="0 0 68 68"
                />
              ) : (
                <div className="w-[68px] h-[68px] bg-slate-100 animate-pulse rounded" />
              )}
            </div>
            <div className="text-left space-y-0.5">
              <span className="text-[10px] font-black uppercase text-indigo-700 block">
                Scan for Live Demo
              </span>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">
                Try BillingSaaS Instantly
              </p>
              <p className="text-[10px] text-slate-500">
                Point mobile camera to test
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Print-specific CSS overrides */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background-color: white !important;
                color: black !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: A4;
                margin: 8mm 8mm 8mm 8mm;
              }
              .break-inside-avoid {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          `,
        }}
      />
    </div>
  );
}
