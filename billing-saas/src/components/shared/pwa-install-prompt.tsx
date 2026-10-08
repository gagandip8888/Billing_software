"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, Check, Share, PlusSquare } from "lucide-react";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";

const STORAGE_KEY_DISMISSED = "billingsaas_pwa_dismissed_until";

export function PwaInstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED);
    if (dismissedUntil && Date.now() < Number(dismissedUntil)) {
      setIsDismissed(true);
      return;
    }

    // Show banner if not installed and (either installable or is iOS)
    if (!isInstalled && (isInstallable || isIOS)) {
      setIsDismissed(false);
    }
  }, [isInstallable, isInstalled, isIOS]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Dismiss for 5 days
    localStorage.setItem(STORAGE_KEY_DISMISSED, String(Date.now() + 5 * 24 * 60 * 60 * 1000));
  };

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }
    const success = await promptInstall();
    if (success) {
      setIsDismissed(true);
    }
  };

  if (isDismissed || isInstalled || (!isInstallable && !isIOS)) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 max-w-sm w-full p-2 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <div className="bg-white border border-blue-200 rounded-2xl shadow-xl shadow-blue-500/10 p-4 relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />

          <button
            onClick={handleDismiss}
            aria-label="Close install prompt"
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-600/20 font-bold">
              ₹
            </div>
            <div className="min-w-0 flex-1 pr-4">
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                Install BillingSaaS App
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                Install on your PC or phone for 1-click counter billing and 100% offline access.
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-blue-600/20"
            >
              <Download className="h-3.5 w-3.5" />
              {isIOS ? "How to Install" : "Install Now"}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-blue-600" /> Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Apple Safari does not allow automatic 1-click prompts. Follow these 2 easy steps:
            </p>

            <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <span>
                  Tap the <strong className="inline-flex items-center gap-1 text-slate-800"><Share className="h-3.5 w-3.5 text-blue-600" /> Share</strong> button in Safari toolbar
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="h-6 w-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <span>
                  Scroll down and select <strong className="inline-flex items-center gap-1 text-slate-800"><PlusSquare className="h-3.5 w-3.5 text-blue-600" /> Add to Home Screen</strong>
                </span>
              </div>
            </div>

            <Button
              onClick={() => setShowIosGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl"
            >
              Got it!
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Compact button for header or sidebar
 */
export function PwaInstallButton({ className }: { className?: string }) {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePwaInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (isInstalled) {
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 ${className || ""}`}>
        <Check className="h-3 w-3" /> App Installed
      </span>
    );
  }

  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }
    await promptInstall();
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition ${className || ""}`}
        title="Install BillingSaaS as an app on your device"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install App</span>
      </button>

      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Install on iPhone</h3>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600">
              Tap the Safari <strong>Share</strong> button and choose <strong>Add to Home Screen</strong>.
            </p>
            <Button onClick={() => setShowIosGuide(false)} className="w-full bg-blue-600 text-white text-xs">
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
