import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface PendingInvoice {
  id: string; // client-generated UUID
  tenantId: string;
  payload: any; // full invoice data (items, customer, etc.)
  createdAt: number; // timestamp
  status: "pending" | "syncing" | "failed";
  error?: string;
  retries: number;
  serverInvoiceId?: string; // after successful sync
}

export interface CachedProduct {
  id: string;
  tenantId: string;
  name: string;
  price: number;
  taxRate: number;
  unit: string;
  stockQty?: number;
  metadata?: any;
  syncedAt: number;
}

export interface CachedCustomer {
  id: string;
  tenantId: string;
  name: string;
  mobile: string;
  syncedAt: number;
}

interface BillingDB extends DBSchema {
  pendingInvoices: {
    key: string;
    value: PendingInvoice;
    indexes: { "by-tenant": string; "by-status": string };
  };
  cachedProducts: {
    key: string;
    value: CachedProduct;
    indexes: { "by-tenant": string };
  };
  cachedCustomers: {
    key: string;
    value: CachedCustomer;
    indexes: { "by-tenant": string };
  };
}

let dbInstance: IDBPDatabase<BillingDB> | null = null;

export async function getDB() {
  if (dbInstance) return dbInstance;
  if (typeof window === "undefined") throw new Error("IndexedDB only works in browser");

  dbInstance = await openDB<BillingDB>("billing-saas-offline", 1, {
    upgrade(db) {
      // Pending invoices store
      const invoiceStore = db.createObjectStore("pendingInvoices", { keyPath: "id" });
      invoiceStore.createIndex("by-tenant", "tenantId");
      invoiceStore.createIndex("by-status", "status");

      // Cached products
      const productStore = db.createObjectStore("cachedProducts", { keyPath: "id" });
      productStore.createIndex("by-tenant", "tenantId");

      // Cached customers
      const customerStore = db.createObjectStore("cachedCustomers", { keyPath: "id" });
      customerStore.createIndex("by-tenant", "tenantId");
    },
  });

  return dbInstance;
}

// === PENDING INVOICES ===

export async function addPendingInvoice(
  invoice: Omit<PendingInvoice, "id" | "createdAt" | "status" | "retries">
) {
  const db = await getDB();
  const pending: PendingInvoice = {
    ...invoice,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: Date.now(),
    status: "pending",
    retries: 0,
  };
  await db.add("pendingInvoices", pending);
  return pending;
}

export async function getPendingInvoices(tenantId: string) {
  const db = await getDB();
  return db.getAllFromIndex("pendingInvoices", "by-tenant", tenantId);
}

export async function getPendingCount(tenantId: string) {
  const db = await getDB();
  const all = await db.getAllFromIndex("pendingInvoices", "by-tenant", tenantId);
  return all.filter((p) => p.status === "pending" || p.status === "failed").length;
}

export async function updatePendingInvoice(id: string, updates: Partial<PendingInvoice>) {
  const db = await getDB();
  const existing = await db.get("pendingInvoices", id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  await db.put("pendingInvoices", updated);
  return updated;
}

export async function deletePendingInvoice(id: string) {
  const db = await getDB();
  await db.delete("pendingInvoices", id);
}

// === CACHE PRODUCTS ===

export async function cacheProducts(tenantId: string, products: CachedProduct[]) {
  const db = await getDB();
  const tx = db.transaction("cachedProducts", "readwrite");
  // Clear old cache for this tenant
  const oldKeys = await tx.store.index("by-tenant").getAllKeys(tenantId);
  for (const key of oldKeys) await tx.store.delete(key);
  // Add fresh
  for (const p of products) await tx.store.put(p);
  await tx.done;
}

export async function getCachedProducts(tenantId: string): Promise<CachedProduct[]> {
  const db = await getDB();
  return db.getAllFromIndex("cachedProducts", "by-tenant", tenantId);
}

// === CACHE CUSTOMERS ===

export async function cacheCustomers(tenantId: string, customers: CachedCustomer[]) {
  const db = await getDB();
  const tx = db.transaction("cachedCustomers", "readwrite");
  const oldKeys = await tx.store.index("by-tenant").getAllKeys(tenantId);
  for (const key of oldKeys) await tx.store.delete(key);
  for (const c of customers) await tx.store.put(c);
  await tx.done;
}

export async function getCachedCustomers(tenantId: string): Promise<CachedCustomer[]> {
  const db = await getDB();
  return db.getAllFromIndex("cachedCustomers", "by-tenant", tenantId);
}
