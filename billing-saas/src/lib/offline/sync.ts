import {
  getPendingInvoices,
  updatePendingInvoice,
  deletePendingInvoice,
  getPendingCount,
  cacheProducts,
  cacheCustomers,
  getCachedProducts,
  getCachedCustomers,
  PendingInvoice,
} from "./db";

export interface SyncResult {
  syncedCount: number;
  failedCount: number;
  remainingPending: number;
  syncedInvoices: Array<{ clientTempId: string; serverInvoiceNo: string; serverInvoiceId: string }>;
}

let isSyncInProgress = false;

/**
 * Synchronize all pending offline invoices to the server
 */
export async function syncPendingInvoices(tenantId: string): Promise<SyncResult> {
  if (typeof window === "undefined" || !navigator.onLine) {
    const remaining = await getPendingCount(tenantId).catch(() => 0);
    return { syncedCount: 0, failedCount: 0, remainingPending: remaining, syncedInvoices: [] };
  }

  if (isSyncInProgress) {
    const remaining = await getPendingCount(tenantId).catch(() => 0);
    return { syncedCount: 0, failedCount: 0, remainingPending: remaining, syncedInvoices: [] };
  }

  isSyncInProgress = true;
  let syncedCount = 0;
  let failedCount = 0;
  const syncedInvoices: Array<{ clientTempId: string; serverInvoiceNo: string; serverInvoiceId: string }> = [];

  try {
    const allPending = await getPendingInvoices(tenantId);
    const toSync = allPending.filter((inv) => inv.status === "pending" || inv.status === "failed");

    for (const inv of toSync) {
      await updatePendingInvoice(inv.id, { status: "syncing" });

      try {
        const response = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inv.payload),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Server responded with ${response.status}`);
        }

        // Successfully created on server
        await deletePendingInvoice(inv.id);
        syncedCount++;
        syncedInvoices.push({
          clientTempId: inv.id,
          serverInvoiceNo: result.invoice?.invoiceNo || "INV-SYNCED",
          serverInvoiceId: result.invoice?.id || "",
        });
      } catch (err: any) {
        console.error(`Failed to sync pending invoice ${inv.id}:`, err);
        failedCount++;
        await updatePendingInvoice(inv.id, {
          status: "failed",
          error: err.message || "Network error",
          retries: (inv.retries || 0) + 1,
        });
      }
    }

    // Trigger storage event so other tabs and components update their badge
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("billingsaas:sync-complete", {
        detail: { syncedCount, failedCount }
      }));
    }

    const remainingPending = await getPendingCount(tenantId);
    return { syncedCount, failedCount, remainingPending, syncedInvoices };
  } finally {
    isSyncInProgress = false;
  }
}

/**
 * Cache current products and customers in IndexedDB for offline autocomplete
 */
export async function syncReferenceData(tenantId: string): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine || !tenantId) return;

  try {
    const [productsRes, customersRes] = await Promise.all([
      fetch("/api/products").catch(() => null),
      fetch("/api/customers").catch(() => null),
    ]);

    if (productsRes && productsRes.ok) {
      const data = await productsRes.json();
      if (Array.isArray(data.products)) {
        await cacheProducts(
          tenantId,
          data.products.map((p: any) => ({
            id: p.id,
            tenantId,
            name: p.name,
            price: Number(p.price),
            taxRate: Number(p.taxRate || 0),
            unit: p.unit || "pc",
            stockQty: p.stockQty !== null && p.stockQty !== undefined ? Number(p.stockQty) : undefined,
            metadata: p.metadata,
            syncedAt: Date.now(),
          }))
        );
      }
    }

    if (customersRes && customersRes.ok) {
      const data = await customersRes.json();
      if (Array.isArray(data.customers)) {
        await cacheCustomers(
          tenantId,
          data.customers.map((c: any) => ({
            id: c.id,
            tenantId,
            name: c.name,
            mobile: c.mobile,
            syncedAt: Date.now(),
          }))
        );
      }
    }
  } catch (err) {
    console.warn("Could not sync reference data for offline cache:", err);
  }
}
