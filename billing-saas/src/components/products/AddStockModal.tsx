"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Package,
  Plus,
  Check,
  Loader2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface LowStockProductItem {
  id: string;
  productId?: string | null;
  name: string;
  stockQty: number;
  lowStockAlert: number;
}

export interface AddStockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: LowStockProductItem | null;
  onSuccess?: (updatedProduct: LowStockProductItem) => void;
}

export function AddStockModal({
  open,
  onOpenChange,
  product,
  onSuccess,
}: AddStockModalProps) {
  const [qtyToAdd, setQtyToAdd] = useState<string>("10");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQtyToAdd("10");
      setIsSubmitting(false);
    }
  }, [open, product]);

  if (!product) return null;

  const currentStock = Number(product.stockQty || 0);
  const parsedAdd = Math.max(0, parseInt(qtyToAdd, 10) || 0);
  const newStock = currentStock + parsedAdd;
  const alertThreshold = Number(product.lowStockAlert ?? 5);
  const willClearAlert = newStock > alertThreshold;

  async function handleAddStock(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!product) return;

    if (parsedAdd <= 0) {
      toast.error("Please enter a valid quantity to add (minimum 1)");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQty: newStock,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update stock quantity");
      }

      toast.success(
        `Added +${parsedAdd} units to ${product.name}! New stock is ${newStock} units.`
      );

      // Notify other components & bell notification
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
        window.dispatchEvent(new CustomEvent("billingsaas:sync-complete"));
      }

      const updated: LowStockProductItem = {
        ...product,
        stockQty: newStock,
      };

      if (onSuccess) {
        onSuccess(updated);
      }

      onOpenChange(false);
    } catch (err: any) {
      console.error("Add stock error:", err);
      toast.error(err.message || "Could not update product stock");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-white border-slate-200 text-slate-900 shadow-2xl">
        <DialogHeader className="text-left space-y-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Replenish Product Stock
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update inventory stock to automatically clear low-stock notifications
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleAddStock} className="space-y-4 my-2">
          {/* Product Info Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Product
                </span>
                <p className="font-bold text-slate-900 text-sm truncate">{product.name}</p>
                {product.productId && (
                  <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 inline-block mt-0.5">
                    ID: {product.productId}
                  </span>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  Current Stock
                </span>
                <Badge
                  variant="outline"
                  className="font-mono font-bold text-xs bg-red-50 text-red-700 border-red-200 mt-0.5"
                >
                  {currentStock} units left
                </Badge>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1 border-t border-slate-200/80">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>
                Low Stock Threshold: <strong>≤ {alertThreshold} units</strong>
              </span>
            </div>
          </div>

          {/* Quantity to Add Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Quantity to Add (+ Units):</span>
              <span className="text-[11px] text-slate-500">Enter units received</span>
            </label>
            <div className="relative">
              <Input
                type="number"
                min="1"
                step="1"
                value={qtyToAdd}
                onChange={(e) => setQtyToAdd(e.target.value)}
                placeholder="e.g. 10"
                autoFocus
                disabled={isSubmitting}
                className="h-10 text-sm font-mono font-semibold pl-3 pr-12 border-slate-300 focus-visible:ring-purple-600"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none font-medium">
                units
              </span>
            </div>

            {/* Quick Increment Pill Chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium mr-1">Quick:</span>
              {[5, 10, 25, 50, 100].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setQtyToAdd(String(amt))}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-mono font-semibold transition ${
                    parsedAdd === amt
                      ? "bg-purple-100 text-purple-800 border-purple-300 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  +{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Projection Preview */}
          <div
            className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
              willClearAlert
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}
          >
            <div className="flex justify-between items-center font-semibold">
              <span>Projected New Stock:</span>
              <span className="font-mono text-sm font-black">
                {currentStock} + {parsedAdd} = {newStock} units
              </span>
            </div>

            {willClearAlert ? (
              <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  ✓ Notification will clear! New stock ({newStock}) exceeds alert limit ({alertThreshold}).
                </span>
              </p>
            ) : (
              <p className="text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>
                  ⚠️ Note: {newStock} units is still at or below threshold ({alertThreshold}). Add more to clear alert.
                </span>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting || parsedAdd <= 0}
              className="text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating Stock...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Add Stock (+{parsedAdd})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddStockModal;

