"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getPendingCount, getPendingInvoices } from "@/lib/offline/db";
import { syncPendingInvoices, syncReferenceData, SyncResult } from "@/lib/offline/sync";
import { useNetworkStatus } from "./use-network-status";

export function useOfflineSync() {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const { isOnline } = useNetworkStatus();

  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  const refreshPendingCount = useCallback(async () => {
    if (typeof window === "undefined" || !tenantId) return;
    try {
      const count = await getPendingCount(tenantId);
      setPendingCount(count);
    } catch (e) {
      console.warn("Could not check pending count:", e);
    }
  }, [tenantId]);

  const syncNow = useCallback(async (): Promise<SyncResult | null> => {
    if (typeof window === "undefined" || !tenantId || !navigator.onLine) {
      return null;
    }

    setIsSyncing(true);
    try {
      const result = await syncPendingInvoices(tenantId);
      setLastSyncedAt(new Date());
      setPendingCount(result.remainingPending);

      if (result.syncedCount > 0) {
        toast.success(
          `Auto-Sync Complete: ${result.syncedCount} offline ${
            result.syncedCount === 1 ? "bill" : "bills"
          } uploaded to cloud!`
        );
      }

      if (result.failedCount > 0) {
        toast.error(`${result.failedCount} bills failed to sync. Will retry automatically.`);
      }

      // Also refresh reference data
      await syncReferenceData(tenantId);

      return result;
    } catch (err: any) {
      console.error("Manual sync error:", err);
      toast.error(`Sync error: ${err.message || "Failed to sync"}`);
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [tenantId]);

  // Initial load & listeners
  useEffect(() => {
    if (!tenantId) return;

    refreshPendingCount();

    // Cache products and customers in background when online
    if (isOnline) {
      syncReferenceData(tenantId).catch(() => {});
    }

    const handleOnline = () => {
      // Small delay to let network stabilize
      setTimeout(() => {
        syncNow();
      }, 1500);
    };

    const handleUpdate = () => {
      refreshPendingCount();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("billingsaas:pending-added", handleUpdate);
    window.addEventListener("billingsaas:sync-complete", handleUpdate);

    // Periodic check every 45s if online and pending items exist
    const interval = setInterval(() => {
      if (navigator.onLine && pendingCount > 0) {
        syncNow();
      } else {
        refreshPendingCount();
      }
    }, 45000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("billingsaas:pending-added", handleUpdate);
      window.removeEventListener("billingsaas:sync-complete", handleUpdate);
      clearInterval(interval);
    };
  }, [tenantId, isOnline, pendingCount, syncNow, refreshPendingCount]);

  return {
    pendingCount,
    isSyncing,
    isOnline,
    lastSyncedAt,
    syncNow,
    refreshPendingCount,
  };
}
