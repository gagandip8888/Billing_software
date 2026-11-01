"use client";

import React, { useState, useEffect } from "react";
import { Package, IndianRupee, Barcode, Loader2, CheckCircle2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { SerializedProduct } from "./ProductTable";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: SerializedProduct | null;
  shopType?: string;
  onSuccess?: (product: any) => void;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: ProductDialogProps) {
  const isEditing = Boolean(product?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for the 10 fields:
  // Name, Price, Cost Price, MRP, Size, Color, Category, Tax, Stock, Barcode
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [category, setCategory] = useState("");
  const [taxRate, setTaxRate] = useState("18");
  const [stockQty, setStockQty] = useState("");
  const [barcode, setBarcode] = useState("");

  // Sync form state when dialog opens or editing product changes
  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name || "");
        setPrice(product.price !== undefined && product.price !== null ? String(product.price) : "");
        setCostPrice(
          product.costPrice !== undefined && product.costPrice !== null ? String(product.costPrice) : ""
        );
        setMrp(product.mrp !== undefined && product.mrp !== null ? String(product.mrp) : "");
        setSize(product.size || "");
        setColor(product.color || "");
        setCategory(product.category || "");
        setTaxRate(
          product.taxRate !== undefined && product.taxRate !== null ? String(product.taxRate) : "18"
        );
        setStockQty(
          product.stockQty !== undefined && product.stockQty !== null ? String(product.stockQty) : "0"
        );
        setBarcode(product.barcode || "");
      } else {
        // Reset to empty defaults for new product
        setName("");
        setPrice("");
        setCostPrice("");
        setMrp("");
        setSize("");
        setColor("");
        setCategory("");
        setTaxRate("18");
        setStockQty("");
        setBarcode("");
      }
    }
  }, [open, product]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate mandatory fields: Name, Price, and Stock
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Product Name is mandatory");
      return;
    }

    const numPrice = Number(price);
    if (!price || isNaN(numPrice) || numPrice <= 0) {
      toast.error("Valid positive Price is mandatory");
      return;
    }

    const numStock = Number(stockQty);
    if (stockQty === "" || isNaN(numStock) || numStock < 0) {
      toast.error("Stock Quantity is mandatory (cannot be negative)");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isEditing ? `/api/products/${product!.id}` : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      const payload = {
        name: trimmedName,
        price: numPrice,
        costPrice: costPrice.trim() !== "" && !isNaN(Number(costPrice)) ? Number(costPrice) : null,
        mrp: mrp.trim() !== "" && !isNaN(Number(mrp)) ? Number(mrp) : null,
        size: size.trim() || null,
        color: color.trim() || null,
        category: category.trim() || null,
        taxRate: taxRate.trim() !== "" && !isNaN(Number(taxRate)) ? Number(taxRate) : 18,
        stockQty: numStock,
        barcode: barcode.trim() || null,
        unit: product?.unit || "pc",
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      toast.success(isEditing ? "Product updated successfully" : "Product added to catalog");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
      }
      onOpenChange(false);
      onSuccess?.(data.product);
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && onOpenChange(val)}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                {isEditing ? "Edit Product" : "Add Product"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {isEditing
                  ? "Update product details. Name, Price, and Stock are mandatory."
                  : "Enter product details to add to catalog. Name, Price, and Stock are mandatory."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Field 1: Name (Mandatory) */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-name" className="text-xs font-semibold text-slate-700">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="prod-name"
              placeholder="e.g. Slim Fit Cotton Shirt, Chocolate Cake, Paracetamol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 text-sm"
              required
              autoFocus
            />
          </div>

          {/* Row: Price & Stock (Both Mandatory) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="prod-price" className="text-xs font-semibold text-slate-700">
                Price (₹) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                <Input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-7 h-9 text-sm font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-stock" className="text-xs font-semibold text-slate-700">
                Stock Quantity <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prod-stock"
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>
          </div>

          {/* Row: Cost Price & MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="prod-costPrice" className="text-xs font-semibold text-slate-700">
                Cost Price (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                <Input
                  id="prod-costPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="pl-7 h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-mrp" className="text-xs font-semibold text-slate-700">
                MRP (₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                <Input
                  id="prod-mrp"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  className="pl-7 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Row: Category & Tax */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="prod-category" className="text-xs font-semibold text-slate-700">
                Category
              </Label>
              <Input
                id="prod-category"
                placeholder="e.g. Apparel, Bakery, Electronics"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-tax" className="text-xs font-semibold text-slate-700">
                Tax (GST %)
              </Label>
              <div className="relative">
                <Input
                  id="prod-tax"
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  placeholder="18"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="pr-7 h-9 text-sm"
                />
                <span className="absolute right-2.5 top-2.5 text-xs font-semibold text-slate-400">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Row: Size & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="prod-size" className="text-xs font-semibold text-slate-700">
                Size
              </Label>
              <Input
                id="prod-size"
                placeholder="e.g. S, M, L, XL, 32, 1kg"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prod-color" className="text-xs font-semibold text-slate-700">
                Color
              </Label>
              <Input
                id="prod-color"
                placeholder="e.g. Navy Blue, Black, White"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Field 10: Barcode */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-barcode" className="text-xs font-semibold text-slate-700">
              Barcode / SKU
            </Label>
            <div className="relative">
              <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="prod-barcode"
                placeholder="Scan or enter barcode / SKU"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="pl-8 h-9 text-sm font-mono"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20 px-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  {isEditing ? "Update Product" : "Add Product"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
