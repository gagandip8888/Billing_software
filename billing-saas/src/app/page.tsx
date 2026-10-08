"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Receipt,
  Store,
  Zap,
  ShieldCheck,
  Smartphone,
  FileText,
  ArrowRight,
  Scissors,
  Cake,
  Hammer,
  Utensils,
  Pill,
  Shirt,
  Sparkles,
  CheckCircle2,
  XCircle,
  WifiOff,
  Printer,
  Users,
  Layers,
  ChevronDown,
  Star,
  Check,
  Menu,
  X,
  Play,
  Clock,
  HelpCircle,
  IndianRupee,
  ShoppingBag,
  Car,
  Camera,
  HeartHandshake,
  Coffee,
  Paintbrush,
  Activity,
  Award,
} from "lucide-react";
import { PLANS, PlanId } from "@/lib/plans";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const shopTypes = [
    { name: "Salons & Spa", icon: Scissors, desc: "Haircuts, facials, stylist commissions", tag: "Beauty" },
    { name: "Bakeries & Cakes", icon: Cake, desc: "Kg weights, custom message, advance orders", tag: "Food" },
    { name: "Hotels & Cafes", icon: Utensils, desc: "Table orders, KOT notes, fast billing", tag: "Hospitality" },
    { name: "Pharmacy & Medical", icon: Pill, desc: "Batch numbers, doctor references, expiry", tag: "Health" },
    { name: "Hardware & Paints", icon: Hammer, desc: "HSN codes, quantity bundles, wholesale", tag: "Retail" },
    { name: "Kirana & Grocery", icon: ShoppingBag, desc: "Barcode scanning, loose kg/ltr, fast cash", tag: "Essentials" },
    { name: "Mobile & Gadgets", icon: Smartphone, desc: "IMEI serials, warranty dates, accessories", tag: "Tech" },
    { name: "Garments & Cloth", icon: Shirt, desc: "Size & color variants, seasonal exchanges", tag: "Fashion" },
    { name: "Beauty Parlors", icon: Sparkles, desc: "Bridal packages, appointment bookings", tag: "Services" },
    { name: "Tea & Snack Stalls", icon: Coffee, desc: "1-tap quick tokens, high-volume counter cash", tag: "Fast Food" },
    { name: "Car Wash & Detailing", icon: Car, desc: "Vehicle plate numbers, wash packages", tag: "Automotive" },
    { name: "Event Photography", icon: Camera, desc: "Booking dates, advance tokens, packages", tag: "Studio" },
    { name: "Florists & Gifts", icon: HeartHandshake, desc: "Bouquets, festive packaging, deliveries", tag: "Gifts" },
    { name: "Tailor & Boutiques", icon: Paintbrush, desc: "Measurements, delivery dates, stitching", tag: "Custom" },
    { name: "Repairs & Services", icon: Activity, desc: "Job cards, service notes, spare parts", tag: "Service" },
  ];

  const features = [
    {
      icon: WifiOff,
      title: "100% Offline-First",
      desc: "Create bills without internet connection. IndexedDB local storage ensures your billing counter never freezes, auto-syncing seamlessly to cloud when online.",
      badge: "Core USP",
    },
    {
      icon: Smartphone,
      title: "Instant WhatsApp Bills",
      desc: "Send PDF invoices and payment reminder links directly to customer WhatsApp with 1 tap. Save on thermal paper rolls while delighting shoppers.",
      badge: "Customer Delight",
    },
    {
      icon: FileText,
      title: "CA-Ready GST Reports",
      desc: "Auto-computes CGST, SGST, and IGST across 0%, 5%, 12%, 18%, 28% slabs. Download ready GSTR-1 outward registers in seconds.",
      badge: "Zero Accounting Stress",
    },
    {
      icon: Printer,
      title: "Thermal & Laser Print",
      desc: "Plug-and-play support for standard 80mm thermal receipt printers, 58mm portable Bluetooth rolls, or formal A4 GST tax invoices.",
      badge: "Any Hardware",
    },
    {
      icon: Layers,
      title: "30+ Tailored Shop Types",
      desc: "Pre-configured custom fields for each trade — IMEI for mobiles, Batch & Expiry for medical, Measurements for tailors, and Table numbers for cafes.",
      badge: "Pre-Configured",
    },
    {
      icon: Users,
      title: "Multi-User Role Security",
      desc: "Give cashiers and billing staff their own logins with restricted permissions while keeping sensitive profit margins and reports exclusive to the owner.",
      badge: "Team Management",
    },
  ];

  const faqs = [
    {
      q: "Does it really work 100% offline without any internet connection?",
      a: "Yes! BillingSaaS uses an advanced Progressive Web App (PWA) architecture with client-side IndexedDB database. You can launch the app, scan products, create bills, and print receipts completely offline. The moment your device detects Wi-Fi or mobile data, all invoices auto-sync to the cloud in the background.",
    },
    {
      q: "Is my shop data and customer information secure?",
      a: "Absolutely. All tenant databases are strictly isolated. Your shop's data is backed up daily and secured with 256-bit encryption in enterprise-grade Supabase PostgreSQL servers situated in AWS Mumbai (India region) for strict data residency compliance.",
    },
    {
      q: "Can I use BillingSaaS on my mobile phone, tablet, or laptop?",
      a: "Yes! BillingSaaS runs on any modern browser (Chrome, Edge, Safari) across Windows PC, Mac, Android phones, and iPads. You can also click 'Install App' to run it as a standalone native desktop or mobile application.",
    },
    {
      q: "Which printers are compatible with BillingSaaS?",
      a: "BillingSaaS works with any standard USB, Bluetooth, or Network receipt printer. We support standard 80mm (3-inch) thermal printers (Epson, TVS, Citizen, NGX), 58mm (2-inch) handheld Bluetooth printers, as well as regular A4/A5 laser/inkjet printers.",
    },
    {
      q: "How does the Free plan work? Are there hidden charges?",
      a: "The Free plan gives you 50 bills every single month forever, completely free with zero credit card required. It includes full offline billing, A4 print, WhatsApp sharing, and customer management. If your business grows beyond 50 bills/month, you can upgrade to Basic for just ₹299/month.",
    },
    {
      q: "How do I pay for paid plans and what payment modes are supported?",
      a: "Subscriptions are processed securely via Razorpay (India's leading payment gateway). We accept UPI (Google Pay, PhonePe, Paytm, BHIM), RuPay/Visa/Mastercard debit and credit cards, and NetBanking from all major Indian banks.",
    },
    {
      q: "Can I export my sales and GST reports for my Chartered Accountant?",
      a: "Yes! Our Reports section features 1-click GSTR-1 CSV exports formatted exactly as required by tax portals and accounting software like Tally. You can also export item-wise sales, customer ledgers, and profit margins.",
    },
    {
      q: "Can I cancel or switch my subscription anytime?",
      a: "Yes, there is no lock-in contract. You can upgrade, downgrade, or cancel your subscription anytime with 1 click in your Shop Settings.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* 1. NAVBAR (Sticky Glass Effect) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/85 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-slate-900 bg-clip-text text-transparent">
                BillingSaaS
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                India Edition 🇮🇳
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition">
              Features
            </a>
            <a href="#shop-types" className="hover:text-blue-600 transition">
              Shop Types
            </a>
            <a href="#how-it-works" className="hover:text-blue-600 transition">
              How It Works
            </a>
            <a href="#pricing" className="hover:text-blue-600 transition">
              Pricing
            </a>
            <a href="#faq" className="hover:text-blue-600 transition">
              FAQ
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <Zap className="h-3.5 w-3.5" />
              Start Free (50 Bills)
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2">
            <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-md hover:bg-slate-50"
              >
                Features
              </a>
              <a
                href="#shop-types"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-md hover:bg-slate-50"
              >
                30+ Shop Types
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-md hover:bg-slate-50"
              >
                How It Works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-md hover:bg-slate-50"
              >
                Pricing Plans
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 px-2 rounded-md hover:bg-slate-50"
              >
                Frequently Asked Questions
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/login"
                className="w-full text-center text-xs font-bold py-2.5 rounded-lg border border-slate-200 text-slate-700"
              >
                Sign In to Existing Shop
              </Link>
              <Link
                href="/register"
                className="w-full text-center text-xs font-bold py-2.5 rounded-lg bg-blue-600 text-white shadow-sm"
              >
                Create Free Account (50 Bills)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Glow gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-400/20 via-indigo-300/20 to-purple-400/10 blur-[100px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide uppercase mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            🇮🇳 Made for Indian Retailers & Service Shops
          </div>

          {/* Main H1 */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 max-w-4xl leading-[1.1]">
            Billing Software That Works{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent underline decoration-blue-500/30">
              Offline
            </span>
          </h1>

          {/* Subtext */}
          <p className="mt-6 text-base sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
            Create bills, print thermal invoices, and track daily sales —{" "}
            <strong className="font-semibold text-slate-800">even when your internet goes down</strong>.
            Tailored workflows for 30+ types of Indian local retail businesses.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Start Free (50 Bills/Mo)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 shadow-sm transition flex items-center justify-center gap-2"
            >
              <Play className="h-4 w-4 text-blue-600 fill-blue-600" />
              Watch Interactive Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              No credit card required
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              100% Offline-first resilience
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              30+ Indian shop templates
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600 font-bold" />
              CA-Ready GST filing
            </span>
          </div>

          {/* Hero Interface Mockup */}
          <div className="mt-14 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl shadow-slate-300/50">
            <div className="rounded-xl border border-slate-200/80 bg-slate-900 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.billingsaas.in/billing/new</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  OFFLINE READY (0ms Lag)
                </span>
              </div>
            </div>

            {/* Interactive Mockup Body */}
            <div className="p-4 sm:p-6 bg-slate-50 rounded-b-xl text-left grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Left Column: POS Item Selection */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-sm text-slate-900">Royal Salon & Spa • Quick Counter POS</h4>
                    <p className="text-xs text-slate-500">Walk-in Customer • Phone: +91 98230 45678</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    #INV-2026-084
                  </span>
                </div>

                {/* Sample items table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase">
                      <tr>
                        <th className="p-2.5">Item / Service</th>
                        <th className="p-2.5 text-center">Qty</th>
                        <th className="p-2.5 text-right">Price</th>
                        <th className="p-2.5 text-right">GST</th>
                        <th className="p-2.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      <tr>
                        <td className="p-2.5 font-semibold">Premium Haircut & Styling</td>
                        <td className="p-2.5 text-center font-bold">1</td>
                        <td className="p-2.5 text-right">₹350.00</td>
                        <td className="p-2.5 text-right text-slate-500">18% (₹63)</td>
                        <td className="p-2.5 text-right font-black">₹413.00</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold">Beard Trim & Herbal Wash</td>
                        <td className="p-2.5 text-center font-bold">1</td>
                        <td className="p-2.5 text-right">₹150.00</td>
                        <td className="p-2.5 text-right text-slate-500">18% (₹27)</td>
                        <td className="p-2.5 text-right font-black">₹177.00</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold">Moroccan Argan Hair Serum (50ml)</td>
                        <td className="p-2.5 text-center font-bold">1</td>
                        <td className="p-2.5 text-right">₹400.00</td>
                        <td className="p-2.5 text-right text-slate-500">18% (₹72)</td>
                        <td className="p-2.5 text-right font-black">₹472.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Totals & 1-Click Actions */}
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-semibold text-slate-900">₹900.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>CGST + SGST (18%):</span>
                    <span className="font-semibold text-slate-900">₹162.00</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100">
                    <span>Shop Discount:</span>
                    <span className="font-semibold text-emerald-600">-₹62.00</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-slate-900">
                    <span>Grand Total:</span>
                    <span className="text-xl text-blue-600">₹1,000.00</span>
                  </div>

                  <div className="pt-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-center font-bold text-emerald-800">
                        ⚡ UPI Paid
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center font-bold text-blue-800">
                        80mm Thermal
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900 text-white text-center text-xs font-bold shadow-sm">
                      Print & Send WhatsApp Invoice
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Stored offline in 3ms. Auto-sync queue active.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM → SOLUTION SECTION */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              The Reality of Indian Retail
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Why Traditional Software Breaks Down in Local Shops
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3">
              Cloud-only software stalls when broadband fails. Heavy desktop software crashes and corrupts files.
              BillingSaaS was engineered from day 1 for zero-downtime reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* The Old Painful Way */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-rose-200">
                <div className="h-10 w-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                  ❌
                </div>
                <div>
                  <h3 className="font-black text-lg text-rose-950">Traditional & Desktop Software</h3>
                  <p className="text-xs text-rose-700">What local retailers suffer with today</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-rose-900">
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Broadband Cable Cut? Billing Halts.</strong>
                    <span className="text-xs text-rose-700">Cloud apps show spinner while impatient customers walk out of your shop without buying.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Vyapar / Busy Desktop File Corruption</strong>
                    <span className="text-xs text-rose-700">Sudden power cuts corrupt local database files, causing catastrophic loss of years of customer khata.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Manual, Headache-Inducing GST Returns</strong>
                    <span className="text-xs text-rose-700">Spending entire weekends sorting paper bills to give sales registers to your Chartered Accountant.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Expensive Hardware Lock-In</strong>
                    <span className="text-xs text-rose-700">Forced to purchase proprietary ₹25,000+ POS machines that become e-waste when broken.</span>
                  </div>
                </li>
              </ul>
            </div>

            {/* The BillingSaaS Modern Way */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 sm:p-8 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-emerald-200">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  ✅
                </div>
                <div>
                  <h3 className="font-black text-lg text-emerald-950">The BillingSaaS Experience</h3>
                  <p className="text-xs text-emerald-700">Built for uninterrupted everyday business</p>
                </div>
              </div>

              <ul className="space-y-4 text-sm text-emerald-950">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">100% Offline-First Architecture</strong>
                    <span className="text-xs text-emerald-800">Bills save in 3 milliseconds to local storage. Your counter keeps ringing without a hiccup.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Intelligent Cloud Auto-Sync</strong>
                    <span className="text-xs text-emerald-800">As soon as your mobile hotspot or Wi-Fi reconnects, all pending invoices sync securely to PostgreSQL.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">1-Click CA-Ready GSTR-1 Exports</strong>
                    <span className="text-xs text-emerald-800">Slab-wise breakdown (0%, 5%, 12%, 18%, 28%) with CGST and SGST splits ready for immediate filing.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Runs on Phone, Tablet, Laptop & Desktop</strong>
                    <span className="text-xs text-emerald-800">Use any device you already own. Connects to standard ₹1,800 Bluetooth & USB thermal printers.</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SHOP TYPES GRID (USP) */}
      <section id="shop-types" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                Industry-Specific Workflows
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
                Built for Every Indian Shop Type
              </h2>
              <p className="text-sm text-slate-500 mt-2 max-w-xl">
                Unlike generic billing apps, BillingSaaS pre-configures units, barcodes, tax slabs, and custom metadata for your specific trade.
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                30+ Trade Profiles Supported
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {shopTypes.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition flex items-center justify-center shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase">
                        {st.tag}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition">
                      {st.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {st.desc}
                    </p>
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-blue-600">
                    <span>Pre-configured</span>
                    <span>&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center bg-white p-4 rounded-2xl border border-slate-200 max-w-3xl mx-auto text-xs text-slate-600 shadow-sm">
            <strong className="text-slate-800">And 15+ more:</strong> Footwear, Stationery, Optical, Toys & Games, Furniture, Cyber Cafe, Pet Shops, Laundry, Catering, and Custom Retailers.
          </div>
        </div>
      </section>

      {/* 5. FEATURES GRID (6 CARDS) */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Powerful Core Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Everything Your Shop Needs to Thrive
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3">
              Engineered with modern web standards, state-of-the-art speed, and deep Indian retail compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{feat.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (3 STEPS) */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Zero Training Required
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Start Billing in 3 Simple Steps
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3">
              No complex installations, no database setups. Start printing invoices in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-md shadow-blue-500/20">
                1
              </div>
              <h3 className="font-black text-base text-slate-900">Sign Up in 30 Seconds</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Enter your shop name, mobile number, and password. No credit card required. Free tier activates instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-md shadow-indigo-500/20">
                2
              </div>
              <h3 className="font-black text-base text-slate-900">Select Your Shop Type</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Choose Salon, Cake Shop, Grocery, Hardware or 30+ others. Your units, tax slabs, and fields auto-configure.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative text-center flex flex-col items-center">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-md shadow-emerald-500/20">
                3
              </div>
              <h3 className="font-black text-base text-slate-900">Start Billing Instantly</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Add items, collect cash or UPI QR payments, print thermal receipts, or share bills on WhatsApp in 1 click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Simple & Honest Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Affordable Plans for Every Indian Business
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Start with our Free tier (50 bills/mo) and upgrade seamlessly with Razorpay as your store volume grows.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="mt-8 inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
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
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
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

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(Object.keys(PLANS) as PlanId[]).map((planKey) => {
              const plan = PLANS[planKey];
              const isPopular = plan.popular;
              const displayPrice = billingCycle === "yearly" ? plan.priceYearly : plan.price;
              const monthlyEquivalent =
                billingCycle === "yearly" && plan.priceYearly > 0
                  ? Math.round(plan.priceYearly / 12)
                  : plan.price;

              return (
                <div
                  key={planKey}
                  className={`relative rounded-2xl flex flex-col justify-between p-6 bg-white border transition duration-200 ${
                    isPopular
                      ? "border-blue-600 shadow-xl shadow-blue-500/10 ring-2 ring-blue-600/20"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-blue-600 text-white shadow-sm">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
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
                    </div>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900 tracking-tight">
                          ₹{displayPrice}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          /{billingCycle === "yearly" ? "year" : "month"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {billingCycle === "yearly" && plan.priceYearly > 0
                          ? `₹${monthlyEquivalent}/mo • Save ₹${plan.price * 12 - plan.priceYearly}/year`
                          : plan.price === 0
                          ? "Free forever • 50 bills/mo"
                          : `Standard monthly rate`}
                      </p>
                    </div>

                    <div className="py-2.5 border-y border-slate-100 mb-4 text-xs font-semibold text-slate-700">
                      <div>{plan.billLimit === -1 ? "Unlimited bills" : `${plan.billLimit} bills/month`}</div>
                      <div className="text-slate-500 mt-0.5">
                        {plan.userLimit === -1 ? "Unlimited staff accounts" : `${plan.userLimit} user account${plan.userLimit > 1 ? "s" : ""}`}
                      </div>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-600 mb-6">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/register"
                    className={`w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      isPopular
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {planKey === "FREE" ? "Get Started Free" : `Choose ${plan.name}`}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 8. TESTIMONIALS & LAUNCH OFFER */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Trusted Across India
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Loved by Shop Owners Across 20+ Cities
            </h2>
            <p className="text-sm sm:text-base text-slate-500 mt-3">
              See how Indian retailers depend on BillingSaaS everyday for reliable billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;Last month our street internet cable snapped during road digging. BillingSaaS didn&apos;t skip a single bill! All 140 evening bills synced automatically when my hotspot reconnected.&rdquo;
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="font-bold text-xs text-slate-900">Rajesh Sharma</p>
                <p className="text-[11px] text-slate-500">Sharma Kirana & General Store • Pune</p>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;WhatsApp billing is magic. My salon customers love getting clean digital receipts directly on their phones, and my thermal paper printing costs dropped by 80%.&rdquo;
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="font-bold text-xs text-slate-900">Pooja Deshmukh</p>
                <p className="text-[11px] text-slate-500">Glamour Salon & Bridal Studio • Nagpur</p>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-500" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                  &ldquo;Giving monthly sales registers to my CA used to take 2 full days of manual tallying. Now I just click &lsquo;Export GSTR-1&rsquo; and WhatsApp the file. Worth every single rupee.&rdquo;
                </p>
              </div>
              <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="font-bold text-xs text-slate-900">Amit Patel</p>
                <p className="text-[11px] text-slate-500">Patel Hardware & Electricals • Ahmedabad</p>
              </div>
            </div>
          </div>

          {/* Launch Special Offer Banner */}
          <div className="mt-12 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md shadow-amber-500/30 flex-shrink-0">
                🎁
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-amber-950">
                  Special Public Launch Offer
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                  The first 100 registered shops get upgraded to our <strong>Pro Plan FREE for 6 months</strong> (Worth ₹3,594).
                </p>
              </div>
            </div>
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 whitespace-nowrap"
            >
              Claim Free Pro Plan &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FAQ SECTION (Accordion) */}
      <section id="faq" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              Got Questions?
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-3">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Everything you need to know about BillingSaaS, offline resilience, and GST reporting.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 overflow-hidden transition"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 bg-white hover:bg-slate-50 transition"
                  >
                    <span className="font-bold text-sm text-slate-900">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-slate-500 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180 text-blue-600" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed bg-white border-t border-slate-100 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA SECTION */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-indigo-700 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Join 1,000+ Smart Retailers
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Start Billing in Under 30 Seconds
          </h2>

          <p className="mt-4 text-base sm:text-lg text-blue-100 max-w-xl font-normal">
            No credit card. No lengthy setup. Create your shop profile now and experience lightning-fast offline billing.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-blue-700 font-black text-sm shadow-xl shadow-blue-900/40 transition flex items-center justify-center gap-2"
            >
              Create Free Account (50 Bills/Mo)
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 transition flex items-center justify-center"
            >
              See All Pricing Plans
            </a>
          </div>

          <p className="mt-5 text-xs text-blue-200">
            Free forever tier • Zero setup fees • Cancel anytime
          </p>
        </div>
      </section>

      {/* 11. COMPREHENSIVE FOOTER */}
      <footer className="bg-white border-t border-slate-200 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-100">
            {/* Column 1: Brand Info */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Receipt className="h-4 w-4" />
                </div>
                <span className="font-black text-lg tracking-tight text-slate-900">BillingSaaS</span>
              </Link>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-sm">
                Next-generation offline-first billing & inventory software built specifically for 30+ types of Indian local retail and service shops.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span>Proudly Built in India 🇮🇳</span>
              </div>
            </div>

            {/* Column 2: Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><Link href="/billing/new" className="hover:text-blue-600">POS Billing Counter</Link></li>
                <li><a href="#features" className="hover:text-blue-600">Offline-First Engine</a></li>
                <li><Link href="/reports" className="hover:text-blue-600">GSTR-1 Tax Reports</Link></li>
                <li><a href="#features" className="hover:text-blue-600">WhatsApp Invoicing</a></li>
                <li><a href="#pricing" className="hover:text-blue-600">Pricing & Plans</a></li>
              </ul>
            </div>

            {/* Column 3: Shop Profiles */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Shop Types</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><a href="#shop-types" className="hover:text-blue-600">Salons & Spas</a></li>
                <li><a href="#shop-types" className="hover:text-blue-600">Bakeries & Cakes</a></li>
                <li><a href="#shop-types" className="hover:text-blue-600">Kirana & Grocery</a></li>
                <li><a href="#shop-types" className="hover:text-blue-600">Hardware Stores</a></li>
                <li><a href="#shop-types" className="hover:text-blue-600">Cafes & Hotels</a></li>
              </ul>
            </div>

            {/* Column 4: Trust & Legal */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Security & Legal</h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><span className="text-slate-500">256-bit SSL Encrypted</span></li>
                <li><span className="text-slate-500">Supabase Cloud (India)</span></li>
                <li><span className="text-slate-500">Razorpay Verified</span></li>
                <li><Link href="/api/health" className="hover:text-blue-600">API Health Check</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} BillingSaaS Technologies. All rights reserved. Ek Software, Saglya Shop Sathi.</p>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-blue-600">Shop Sign In</Link>
              <Link href="/register" className="hover:text-blue-600">Create Free Account</Link>
              <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Demo Video / Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDemoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Play className="h-5 w-5 fill-blue-600" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">BillingSaaS Walkthrough Demo</h3>
                <p className="text-xs text-slate-500">60-second tour of offline POS billing, GST reports, and WhatsApp invoices</p>
              </div>
            </div>

            <div className="aspect-video bg-slate-900 rounded-xl flex flex-col items-center justify-center text-center p-6 text-white relative overflow-hidden">
              <Receipt className="h-12 w-12 text-blue-400 mb-3 animate-pulse" />
              <h4 className="font-bold text-base">Live Interactive Terminal is Available!</h4>
              <p className="text-xs text-slate-300 max-w-sm mt-1">
                You can try the real POS terminal right now without registration.
              </p>
              <Link
                href="/billing/new"
                onClick={() => setDemoModalOpen(false)}
                className="mt-4 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Open Live POS Terminal &rarr;
              </Link>
            </div>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setDemoModalOpen(false)} className="text-xs">
                Close Window
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
