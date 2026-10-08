import React from "react";
import Link from "next/link";
import { Receipt, ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Terms of Service | BillingSaaS",
  description: "Terms of Service and Merchant Usage Agreement for BillingSaaS",
};

export default function TermsPage() {
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
            <h1 className="text-3xl font-black text-slate-900">Terms of Service</h1>
            <p className="text-xs text-slate-500 mt-1">Effective Date: September 26, 2026 • Version 1.0</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">1. Agreement to Terms</h2>
            <p>
              By registering, accessing, or using BillingSaaS (&ldquo;Service&rdquo;, &ldquo;Platform&rdquo;), provided by BillingSaaS Technologies Pvt. Ltd. (&ldquo;Company&rdquo;, &ldquo;We&rdquo;, &ldquo;Us&rdquo;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">2. Description of Service</h2>
            <p>
              BillingSaaS provides cloud and offline-first point of sale (POS) billing, inventory tracking, GST invoice generation, and financial reporting tools designed for Indian retail and service businesses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">3. Subscriptions & Payments</h2>
            <p>
              BillingSaaS offers a Free Plan (limited to 50 bills/month) and paid subscription plans (Basic, Pro, Enterprise). Subscriptions are billed on a recurring monthly or annual basis via Razorpay. Prices are inclusive of applicable GST taxes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">4. User Account & Data Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your credentials and for all activities under your shop account. You retain ownership of all trade data, inventory records, and customer information uploaded to the Platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">5. Offline Sync & Availability</h2>
            <p>
              BillingSaaS utilizes local browser IndexedDB storage to allow billing during internet outages. You acknowledge that offline data is cached locally on your device until network connection is restored to complete synchronization with cloud servers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">6. Limitation of Liability</h2>
            <p>
              In no event shall BillingSaaS Technologies be liable for indirect, incidental, or consequential damages arising from service interruption, device failure, or improper GST tax filing entries. Total liability shall not exceed the subscription fees paid in the preceding 3 months.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">7. Governing Law & Jurisdiction</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of courts located in Maharashtra, India.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Contact & Legal Inquiries</h2>
            <p className="text-xs text-slate-600">
              For any questions regarding these terms, please contact us at <a href="mailto:legal@billingsaas.app" className="text-blue-600 font-semibold underline">legal@billingsaas.app</a> or visit our <Link href="/contact" className="text-blue-600 font-semibold underline">Contact Page</Link>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
