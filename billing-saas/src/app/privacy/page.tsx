import React from "react";
import Link from "next/link";
import { Receipt, ArrowLeft, Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | BillingSaaS",
  description: "Privacy Policy and Data Protection standards of BillingSaaS",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-lg text-slate-900">
            <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Receipt className="h-4 w-4" />
            </div>
            BillingSaaS
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="border-b border-slate-100 pb-4">
            <h1 className="text-3xl font-black text-slate-900">Privacy Policy</h1>
            <p className="text-xs text-slate-500 mt-1">Effective Date: September 26, 2026 • Version 1.0</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
            <p>
              We collect information you provide during shop registration (business name, mobile number, GSTIN, shop type) and operational transaction records (invoices, customer details, product inventory).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">2. How We Use Your Data</h2>
            <p>
              Your data is strictly used to deliver billing services, generate GST analytics, process Razorpay payments, send WhatsApp receipts upon your request, and perform offline-to-cloud synchronization. We do NOT sell or rent your data to third parties.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">3. Data Storage & Encryption</h2>
            <p>
              All customer database records are stored securely in Supabase PostgreSQL servers (AWS Mumbai, India region) protected by 256-bit SSL encryption. Local offline cache is stored securely within your browser&apos;s IndexedDB environment.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">4. Payment Gateway Security</h2>
            <p>
              Online subscription payments are processed securely via Razorpay. BillingSaaS does not store credit card numbers, CVVs, or NetBanking passwords on our servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">5. Your Data Rights</h2>
            <p>
              You retain full ownership of your business records. You can export your sales, products, and customer databases to CSV format anytime, or request account deletion by emailing support.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Privacy Contact</h2>
            <p className="text-xs text-slate-600">
              For data protection or privacy requests, email <a href="mailto:privacy@billingsaas.app" className="text-blue-600 font-semibold underline">privacy@billingsaas.app</a>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
