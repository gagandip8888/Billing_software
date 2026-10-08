"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { WifiOff, RefreshCw, PlusCircle, FileSpreadsheet, ArrowLeft, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  const [isChecking, setIsChecking] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setIsChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.reload();
      } else {
        setIsChecking(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            ₹
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900">BillingSaaS</span>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          Offline Mode
        </span>
      </header>

      {/* Main Content Card */}
      <main className="max-w-xl mx-auto w-full my-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-10 text-center">
          {/* Icon Badge */}
          <div className="relative mx-auto mb-6 h-20 w-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
            <WifiOff className="h-10 w-10 animate-bounce" />
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white">
              ⚡
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            No Internet Connection
          </h1>
          <p className="text-sm font-medium text-blue-600 mb-3">
            काळजी करू नका! Don&apos;t worry, your shop billing never stops.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto mb-8">
            Unlike competitors, BillingSaaS is built with offline-first support for Indian small towns and villages. 
            You can keep creating bills, calculating GST, and printing receipts offline. Everything syncs automatically when your connection returns.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <Button
              onClick={handleRetry}
              disabled={isChecking}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
              {isChecking ? "Checking Connection..." : "Retry Connection"}
            </Button>

            <Link href="/billing/new" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2"
              >
                <PlusCircle className="h-4 w-4 text-emerald-600" />
                Create Bill Offline
              </Button>
            </Link>
          </div>

          {/* Feature Highlights for Shopkeepers */}
          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">100% Safe Local Storage</p>
                <p className="text-[11px] text-slate-500">Drafts and cached items remain intact on your device.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
              <Zap className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-slate-800">Automatic Sync</p>
                <p className="text-[11px] text-slate-500">Transactions will push to cloud as soon as internet is restored.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-500">
          <Link href="/dashboard" className="hover:text-blue-600 flex items-center gap-1.5 transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span>•</span>
          <Link href="/invoices" className="hover:text-blue-600 flex items-center gap-1.5 transition">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Recent Invoices
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-400">
        BillingSaaS • Ek Software, Saglya Shop Sathi • Offline-First Technology
      </footer>
    </div>
  );
}
