import React from "react";
import Link from "next/link";
import { Receipt } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 group-hover:scale-105 transition-transform">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <span className="font-extrabold text-lg text-white tracking-tight">BillingSaaS</span>
            <span className="block text-[10px] uppercase font-semibold text-blue-400 tracking-wider">
              India Edition
            </span>
          </div>
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition-colors"
        >
          &larr; Back to Home
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-xl">{children}</div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto text-center py-4 text-xs text-slate-500">
        &copy; {new Date().getFullYear()} BillingSaaS. Multi-Tenant Billing Software for Indian Small Businesses.
      </footer>
    </div>
  );
}
