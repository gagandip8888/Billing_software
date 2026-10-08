"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProductForm } from "./ProductForm";
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
  shopType,
  onSuccess,
}: ProductDialogProps) {
  const isEditing = Boolean(product?.id);

  function handleSuccess(savedProduct: any) {
    onOpenChange(false);
    onSuccess?.(savedProduct);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2 border-b border-slate-100">
          <DialogTitle className="text-lg font-bold text-slate-900">
            {isEditing ? "Edit Product / Service" : "Add New Product / Service"}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {isEditing
              ? "Update details, pricing, inventory alerts, or shop-specific attributes."
              : "Fill in the product details. Shop-specific dynamic fields are loaded based on your business type."}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <ProductForm
            key={product?.id || "new"}
            initialData={product}
            shopType={shopType}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
            isDialog={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
