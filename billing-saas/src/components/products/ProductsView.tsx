"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, ExternalLink, Package, AlertTriangle, Layers, DollarSign } from "lucide-react";

import { ProductTable, SerializedProduct } from "./ProductTable";
import { ProductDialog } from "./ProductDialog";
import { Button } from "@/components/ui/button";

interface ProductsViewProps {
  initialProducts: SerializedProduct[];
  shopType: string;
  businessName: string;
}

export function ProductsView({
  initialProducts,
  shopType,
  businessName,
}: ProductsViewProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SerializedProduct | null>(null);

  // Compute catalog stats
  const totalProducts = initialProducts.length;
  const lowStockCount = initialProducts.filter(
    (p) =>
      p.stockQty !== null &&
      p.stockQty !== undefined &&
      p.lowStockAlert !== null &&
      p.lowStockAlert !== undefined &&
      p.stockQty <= p.lowStockAlert
  ).length;

  const totalInventoryValue = initialProducts.reduce((acc, p) => {
    if (p.stockQty && p.price) {
      return acc + p.stockQty * p.price;
    }
    return acc;
  }, 0);

  const categoryCount = new Set(
    initialProducts.map((p) => p.category).filter(Boolean)
  ).size;

  function handleOpenAdd() {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(product: SerializedProduct) {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }

  function handleSaved() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Products & Services Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your items, pricing, inventory stock alerts, and shop-specific metadata for{" "}
            <span className="font-semibold text-slate-700">{businessName}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/products/new">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-9 text-slate-700 hidden sm:flex items-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Full Page Add
            </Button>
          </Link>

          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" /> Quick Add Product
          </Button>
        </div>
      </div>

      {/* METRIC STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalProducts}</div>
            <div className="text-xs text-slate-500">Total Items</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{lowStockCount}</div>
            <div className="text-xs text-slate-500">Low Stock Alerts</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              ₹{totalInventoryValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500">Retail Stock Value</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{categoryCount}</div>
            <div className="text-xs text-slate-500">Categories</div>
          </div>
        </div>
      </div>

      {/* TABLE COMPONENT */}
      <ProductTable
        initialProducts={initialProducts}
        shopType={shopType}
        onAddProduct={handleOpenAdd}
        onEditProduct={handleOpenEdit}
      />

      {/* QUICK ADD/EDIT DIALOG */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        shopType={shopType}
        onSuccess={handleSaved}
      />
    </div>
  );
}
