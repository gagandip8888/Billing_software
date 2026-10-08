import React from "react";
import Link from "next/link";
import { Receipt, ArrowLeft, RefreshCw } from "lucide-react";

export const metadata = {
  title: "Cancellation & Refund Policy | BillingSaaS",
  description: "Cancellation, Subscription Upgrades, and Refund Policy for BillingSaaS",
};

export default function RefundPage() {
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
            <h1 className="text-3xl font-black text-slate-900">Cancellation & Refund Policy</h1>
            <p className="text-xs text-slate-500 mt-1">Effective Date: September 26, 2026 • Version 1.0</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">1. Free Plan & No Mandatory Binding</h2>
            <p>
              BillingSaaS provides a Free Plan with 50 bills per month forever. You can evaluate all core features without entering payment details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">2. 7-Day Money-Back Guarantee</h2>
            <p>
              If you purchase a paid subscription (Basic, Pro, Enterprise) and are not satisfied with the Service, you can request a 100% full refund within <strong>7 days</strong> of your initial transaction. No questions asked.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">3. Subscription Cancellation</h2>
            <p>
              You may cancel your subscription at any time through your Shop Settings. Upon cancellation, your paid plan remains active until the end of your current billing cycle, after which your account automatically reverts to the Free Plan.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">4. Refund Processing Timeline</h2>
            <p>
              Once approved, refunds are credited back to the original payment method (UPI, credit/debit card, or bank account) via Razorpay within <strong>5 to 7 business days</strong>.
            </p>
          </section>

          <section className="space-y-3 pt-4 border-t border-slate-100">
            <h2 className="text-base font-bold text-slate-900">How to Request a Refund</h2>
            <p className="text-xs text-slate-600">
              To request a refund, please email your Razorpay Payment ID and business mobile number to <a href="mailto:support@billingsaas.app" className="text-blue-600 font-semibold underline">support@billingsaas.app</a> or reach out via our <Link href="/contact" className="text-blue-600 font-semibold underline">Contact Support Page</Link>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
