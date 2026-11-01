"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  AlertTriangle,
  IndianRupee,
  Layers,
  Search,
  Plus,
  FileSpreadsheet,
  X,
} from "lucide-react";

import { ProductTable, SerializedProduct } from "./ProductTable";
import { ProductDialog } from "./ProductDialog";
import { ImportProductsDialog } from "./ImportProductsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<SerializedProduct | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLowStock, setFilterLowStock] = useState(searchParams.get("filter") === "low_stock");
  const highlightId = searchParams.get("highlight");

  useEffect(() => {
    if (searchParams.get("filter") === "low_stock") {
      setFilterLowStock(true);
    }
  }, [searchParams]);

  // Compute catalog stats
  const totalProducts = initialProducts.length;
  const lowStockCount = initialProducts.filter(
    (p) =>
      p.stockQty !== null &&
      p.stockQty !== undefined &&
      Number(p.stockQty) <=
        Number(p.lowStockAlert !== null && p.lowStockAlert !== undefined ? p.lowStockAlert : 5)
  ).length;

  const totalInventoryValue = initialProducts.reduce((acc, p) => {
    if (p.stockQty && p.price) {
      return acc + Number(p.stockQty) * Number(p.price);
    }
    return acc;
  }, 0);

  const categoryCount = new Set(
    initialProducts.map((p) => p.category).filter(Boolean)
  ).size;

  // Filter products by low stock if active
  const filteredProducts = useMemo(() => {
    if (!filterLowStock) return initialProducts;
    return initialProducts.filter(
      (p) =>
        p.stockQty !== null &&
        p.stockQty !== undefined &&
        Number(p.stockQty) <=
          Number(p.lowStockAlert !== null && p.lowStockAlert !== undefined ? p.lowStockAlert : 5)
    );
  }, [initialProducts, filterLowStock]);

  function handleOpenAdd() {
    setEditingProduct(null);
    setIsDialogOpen(true);
  }

  function handleOpenEdit(product: SerializedProduct) {
    setEditingProduct(product);
    setIsDialogOpen(true);
  }

  function handleSaved() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("products:updated"));
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Products & Inventory
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Catalog and inventory management for{" "}
          <span className="font-semibold text-slate-700">{businessName}</span>
        </p>
      </div>

      {/* 4 STATS CARDS AT THE TOP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{totalProducts}</div>
            <div className="text-xs text-slate-500 font-medium">Total Items</div>
          </div>
        </div>

        <div
          onClick={() => {
            const next = !filterLowStock;
            setFilterLowStock(next);
            if (!next) {
              router.push("/products");
            } else {
              router.push("/products?filter=low_stock");
            }
          }}
          className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between cursor-pointer transition select-none ${
            filterLowStock
              ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-50/40"
              : "border-slate-200 hover:border-amber-300"
          }`}
          title="Click to toggle low stock filter"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">{lowStockCount}</div>
              <div className="text-xs text-slate-500 font-medium">Low Stock</div>
            </div>
          </div>
          {filterLowStock && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">
              ₹{totalInventoryValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="text-xs text-slate-500 font-medium">Stock Value</div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{categoryCount}</div>
            <div className="text-xs text-slate-500 font-medium">Categories</div>
          </div>
        </div>
      </div>

      {/* BELOW STATS: CLEAN SEARCH BAR & ONLY TWO BUTTONS */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search products by name, category, barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-slate-50/70 border-slate-200 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            size="sm"
            className="text-xs h-9 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-semibold shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            Import from Excel
          </Button>

          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </Button>
        </div>
      </div>

      {/* LOW STOCK FILTER ACTIVE BANNER */}
      {filterLowStock && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Showing only <strong>{filteredProducts.length} low-stock products</strong> (stock &le; alert limit).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setFilterLowStock(false);
              router.push("/products");
            }}
            className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition"
          >
            <span>Clear Filter</span>
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* PRODUCTS TABLE */}
      <ProductTable
        initialProducts={filteredProducts}
        searchQuery={searchQuery}
        shopType={shopType}
        highlightId={highlightId}
        onAddProduct={handleOpenAdd}
        onEditProduct={handleOpenEdit}
      />

      {/* SIMPLE ADD/EDIT MODAL */}
      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        shopType={shopType}
        onSuccess={handleSaved}
      />

      {/* EXCEL IMPORT MODAL */}
      <ImportProductsDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleSaved}
      />
    </div>
  );
}
