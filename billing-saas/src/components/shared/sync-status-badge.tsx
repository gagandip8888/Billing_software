"use client";

import React from "react";
import { Cloud, CloudOff, RefreshCw, CheckCircle2, Zap } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { Button } from "@/components/ui/button";

export function SyncStatusBadge({ className }: { className?: string }) {
  const { pendingCount, isSyncing, isOnline, syncNow } = useOfflineSync();

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-semibold shadow-sm transition-all ${
        isOnline
          ? "bg-amber-50 border-amber-300 text-amber-900"
          : "bg-slate-900 border-amber-500/40 text-amber-300"
      } ${className || ""}`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="truncate">
          <strong>{pendingCount}</strong> {pendingCount === 1 ? "bill" : "bills"} pending sync
        </span>
      </div>

      {isOnline && (
        <button
          onClick={() => syncNow()}
          disabled={isSyncing}
          className="ml-1 px-2 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition shadow-xs"
          title="Upload pending offline bills to cloud now"
        >
          <RefreshCw className={`h-3 w-3 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
        </button>
      )}
    </div>
  );
}
