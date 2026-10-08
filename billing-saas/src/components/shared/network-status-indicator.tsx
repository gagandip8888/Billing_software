"use client";

import React, { useState } from "react";
import { WifiOff, Wifi, RefreshCw, X, Cloud, CloudOff } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useOfflineSync } from "@/hooks/use-offline-sync";

export function NetworkStatusIndicator() {
  const { isOnline, isOffline, wasOffline, checkRealConnection } = useNetworkStatus();
  const { pendingCount, isSyncing, syncNow } = useOfflineSync();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    await checkRealConnection();
    if (navigator.onLine && pendingCount > 0) {
      await syncNow();
    }
    setIsRetrying(false);
  };

  // Condition 1: Online with pending bills waiting to sync
  if (isOnline && pendingCount > 0) {
    return (
      <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg animate-in fade-in slide-in-from-top-3 duration-300">
        <div className="bg-amber-500 text-slate-950 border border-amber-600 rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-amber-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-slate-950/10 flex items-center justify-center font-bold flex-shrink-0">
              <Cloud className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">Offline Bills Pending Sync</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-950/15 rounded-full font-bold">
                  {pendingCount}
                </span>
              </div>
              <p className="text-[11px] text-slate-900/80 truncate">
                Internet is restored. Syncing bills to cloud...
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-slate-950 text-white hover:bg-slate-800 transition text-xs font-bold flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Condition 2: Back online banner (brief)
  if (isOnline && wasOffline && pendingCount === 0) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg shadow-emerald-600/30 flex items-center gap-2.5 text-xs font-semibold">
          <Wifi className="h-4 w-4" />
          <span>Internet Restored • All Data Synced</span>
        </div>
      </div>
    );
  }

  // Condition 3: Offline banner
  if (isOffline && !isDismissed) {
    return (
      <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg animate-in fade-in slide-in-from-top-3 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white border border-amber-500/30 rounded-2xl p-3 sm:p-3.5 shadow-2xl shadow-black/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <WifiOff className="h-4 w-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-300">Offline Mode Active</span>
                {pendingCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold">
                    {pendingCount} queued
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                {pendingCount > 0
                  ? `${pendingCount} bill(s) saved in local queue. Will sync automatically.`
                  : "Counter billing works offline! Bills save to local device storage."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              title="Check Connection"
              className="p-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-xs font-medium flex items-center gap-1"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin text-amber-400" : ""}`} />
              <span className="hidden sm:inline">Retry</span>
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              title="Dismiss for now"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Condition 4: If dismissed, tiny floating pill in bottom right
  if (isOffline && isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 right-4 z-50 bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition"
      >
        <WifiOff className="h-3.5 w-3.5" />
        <span>Offline {pendingCount > 0 ? `(${pendingCount})` : ""}</span>
      </button>
    );
  }

  return null;
}
