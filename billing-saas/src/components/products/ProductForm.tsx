"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Package,
  Layers,
  IndianRupee,
  Boxes,
  Barcode,
  Sparkles,
  Loader2,
  CheckCircle2,
  Percent,
  Shirt,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";

import { productSchema, ProductInput } from "@/lib/validations/product";
import { SHOP_TEMPLATES, ProductFieldDefinition } from "@/lib/shop-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface ProductFormProps {
  initialData?: any;
  shopType?: string;
  onSuccess?: (product: any) => void;
  onCancel?: () => void;
  isDialog?: boolean;
}

const COMMON_GST_RATES = [0, 5, 12, 18, 28];
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "38", "40", "42", "Free Size"];

export function ProductForm({
  initialData,
  shopType: propShopType,
  onSuccess,
  onCancel,
  isDialog = false,
}: ProductFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic shop type resolution
  const shopType =
    propShopType ||
    (session?.user?.shopType as string) ||
    "CUSTOM";

  const isClothingShop =
    shopType === "CLOTH_SHOP" ||
    shopType === "CLOTHING" ||
    shopType?.toLowerCase().includes("cloth") ||
    (session?.user?.shopType as string) === "CLOTH_SHOP" ||
    (session?.user?.shopType as string) === "CLOTHING";

  const template = SHOP_TEMPLATES[shopType] || SHOP_TEMPLATES.CUSTOM;

  // Initialize form
  const isEditing = Boolean(initialData?.id);

  // Multi-size variant generator state
  const [sizeVariants, setSizeVariants] = useState<
    Array<{ size: string; color: string; stockQty: number; barcode?: string }>
  >([]);

  // Auto-generated Product ID display
  const [autoProductId, setAutoProductId] = useState<string>(
    initialData?.productId || ""
  );

  React.useEffect(() => {
    if (initialData?.productId) {
      setAutoProductId(String(initialData.productId));
    } else {
      fetch("/api/products?nextId=true")
        .then((res) => res.json())
        .then((data) => {
          if (data?.nextProductNo) {
            setAutoProductId(String(data.nextProductNo));
          }
        })
        .catch(() => {});
    }
  }, [initialData?.productId]);

  const defaultValues: Partial<ProductInput> = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || (isClothingShop ? "Clothing" : ""),
    size: initialData?.size || "",
    color: initialData?.color || "",
    brand: initialData?.brand || "",
    mrp: initialData?.mrp ? Number(initialData.mrp) : undefined,
    variantGroupId: initialData?.variantGroupId || "",
    price: initialData?.price !== undefined ? Number(initialData.price) : 0,
    costPrice: initialData?.costPrice ? Number(initialData.costPrice) : undefined,
    taxRate:
      initialData?.taxRate !== undefined
        ? Number(initialData.taxRate)
        : template.taxEnabled
        ? (isClothingShop ? 5 : template.defaultGstRate)
        : 0,
    hsnCode: initialData?.hsnCode || (isClothingShop ? "6205" : ""),
    unit: initialData?.unit || (isClothingShop ? "piece" : template.units?.[0] ?? "pc"),
    stockQty: initialData?.stockQty !== null && initialData?.stockQty !== undefined
      ? Number(initialData.stockQty)
      : undefined,
    lowStockAlert:
      initialData?.lowStockAlert !== null && initialData?.lowStockAlert !== undefined
        ? Number(initialData.lowStockAlert)
        : (isClothingShop ? 5 : undefined),
    barcode: initialData?.barcode || "",
    metadata: (initialData?.metadata as Record<string, any>) || {},
    isActive: initialData?.isActive ?? true,
  };

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const currentTaxRate = watch("taxRate");
  const currentUnit = watch("unit");
  const currentSize = watch("size");
  const currentColor = watch("color");
  const metadataValues = watch("metadata") || {};

  function addSizeVariantRow() {
    setSizeVariants((prev) => [
      ...prev,
      {
        size: "L",
        color: currentColor || "Default",
        stockQty: 10,
        barcode: "",
      },
    ]);
  }

  function removeSizeVariantRow(index: number) {
    setSizeVariants((prev) => prev.filter((_, idx) => idx !== index));
  }

  function updateSizeVariant(index: number, key: string, val: any) {
    setSizeVariants((prev) =>
      prev.map((v, idx) => (idx === index ? { ...v, [key]: val } : v))
    );
  }

  async function onSubmit(data: ProductInput) {
    setIsSubmitting(true);
    try {
      const endpoint = isEditing
        ? `/api/products/${initialData.id}`
        : "/api/products";
      const method = isEditing ? "PATCH" : "POST";

      // If size variants were added, attach variantGroupId
      const variantGroupId =
        data.variantGroupId ||
        (sizeVariants.length > 0 ? `vg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` : null);

      const mainProductPayload = {
        ...data,
        variantGroupId: variantGroupId || null,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mainProductPayload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to save product");
      }

      // If additional size variants defined, create them too
      if (sizeVariants.length > 0 && !isEditing) {
        for (const variant of sizeVariants) {
          try {
            await fetch("/api/products", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...data,
                size: variant.size,
                color: variant.color || data.color,
                stockQty: Number(variant.stockQty) || 0,
                barcode: variant.barcode || undefined,
                variantGroupId,
              }),
            });
          } catch (varErr) {
            console.warn("Failed to create child variant:", varErr);
          }
        }
      }

      toast.success(
        isEditing
          ? "Product updated successfully"
          : sizeVariants.length > 0
          ? `Created product and ${sizeVariants.length} size variants!`
          : "Product added to catalog"
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
      }

      if (onSuccess) {
        onSuccess(result.product);
      } else {
        router.push("/products");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* SECTION 1: BASIC INFORMATION */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Basic Information</h3>
              <p className="text-xs text-slate-500">Name, category, and catalog description</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] font-normal text-slate-500 bg-slate-50">
            {template.name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Read-only Auto-generated Product ID */}
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="productId" className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Product ID</span>
              <span className="text-[11px] font-normal text-slate-400">Auto-generated</span>
            </Label>
            <Input
              id="productId"
              value={autoProductId ? `Product ID: ${autoProductId} (Auto-generated)` : "Product ID: (Auto-generated)"}
              readOnly
              disabled
              className="h-9 text-xs bg-slate-50 text-slate-700 font-mono font-semibold cursor-not-allowed border-slate-200"
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700">
              Product / Service Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g. Chocolate Truffle Cake 1kg, Men's Haircut, Paracetamol 650mg"
              className="h-9 text-sm"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-[11px] text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-xs font-semibold text-slate-700">
              Category
            </Label>
            <Input
              id="category"
              placeholder="e.g. Cakes, Pastries, Hair Services, FMCG"
              className="h-9 text-sm"
              {...register("category")}
            />
            {errors.category && (
              <p className="text-[11px] text-red-500">{errors.category.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit" className="text-xs font-semibold text-slate-700">
              Unit of Measurement <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="unit"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || "pc"}>
                    <SelectTrigger id="unit" className="h-9 text-sm flex-1">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {template.units && template.units.length > 0 ? (
                        template.units.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="pc">pc (Piece)</SelectItem>
                          <SelectItem value="kg">kg (Kilogram)</SelectItem>
                          <SelectItem value="gm">gm (Gram)</SelectItem>
                          <SelectItem value="liter">liter (Liter)</SelectItem>
                          <SelectItem value="meter">meter</SelectItem>
                          <SelectItem value="service">service</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                placeholder="Or custom"
                className="h-9 text-sm w-28"
                value={currentUnit}
                onChange={(e) => setValue("unit", e.target.value)}
              />
            </div>
            {errors.unit && (
              <p className="text-[11px] text-red-500">{errors.unit.message}</p>
            )}
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="description" className="text-xs font-semibold text-slate-700">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Add key highlights, specifications, or notes visible on invoices"
              className="text-sm resize-none"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-[11px] text-red-500">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* CLOTHING MATRIX SECTION (for CLOTH_SHOP / CLOTHING) */}
      {isClothingShop && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shirt className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Clothing & Apparel Specifications</h3>
                <p className="text-xs text-slate-500">Size, Color, Brand, MRP, and size variants</p>
              </div>
            </div>
            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 text-[11px]">
              Clothing Matrix
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brand" className="text-xs font-semibold text-slate-700">
                Brand / Label
              </Label>
              <Input
                id="brand"
                placeholder="e.g. Levis, Zara, Raymond"
                className="h-9 text-sm"
                {...register("brand")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="color" className="text-xs font-semibold text-slate-700">
                Color / Shade
              </Label>
              <Input
                id="color"
                placeholder="e.g. Blue, Black, Maroon"
                className="h-9 text-sm"
                {...register("color")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size" className="text-xs font-semibold text-slate-700">
                Primary Size
              </Label>
              <Input
                id="size"
                placeholder="e.g. L, 32, Free Size"
                className="h-9 text-sm"
                {...register("size")}
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {["S", "M", "L", "XL", "XXL", "30", "32", "34", "36"].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setValue("size", sz)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                      currentSize === sz
                        ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mrp" className="text-xs font-semibold text-slate-700">
                MRP (Printed Price ₹)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">₹</span>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-7 h-9 text-sm font-semibold text-slate-900"
                  {...register("mrp")}
                />
              </div>
            </div>
          </div>

          {/* Add Size Variant Section */}
          {!isEditing && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Additional Size Variants</h4>
                  <p className="text-[11px] text-slate-500">
                    Stocking this same shirt/pant in multiple sizes? Add them here to create all variants at once.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSizeVariantRow}
                  className="h-8 text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Size Variant
                </Button>
              </div>

              {sizeVariants.length > 0 && (
                <div className="space-y-2 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-600 px-1">
                    <span className="col-span-3">Size</span>
                    <span className="col-span-3">Color</span>
                    <span className="col-span-2">Stock Qty</span>
                    <span className="col-span-3">Barcode (optional)</span>
                    <span className="col-span-1 text-right">Remove</span>
                  </div>

                  {sizeVariants.map((variant, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-3">
                        <Input
                          placeholder="e.g. XL or 34"
                          value={variant.size}
                          onChange={(e) => updateSizeVariant(idx, "size", e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="e.g. Blue"
                          value={variant.color}
                          onChange={(e) => updateSizeVariant(idx, "color", e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={variant.stockQty}
                          onChange={(e) => updateSizeVariant(idx, "stockQty", e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          placeholder="Barcode / SKU"
                          value={variant.barcode || ""}
                          onChange={(e) => updateSizeVariant(idx, "barcode", e.target.value)}
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSizeVariantRow(idx)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PRICING & GST TAX */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Pricing & GST Tax</h3>
            <p className="text-xs text-slate-500">Selling price, optional cost price, and GST slab</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price" className="text-xs font-semibold text-slate-700">
              Selling Price (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">
                ₹
              </span>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 h-9 text-sm font-semibold text-slate-900"
                {...register("price")}
              />
            </div>
            {errors.price && (
              <p className="text-[11px] text-red-500">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="costPrice" className="text-xs font-semibold text-slate-700">
              Cost Price (₹)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-semibold text-slate-400">
                ₹
              </span>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="pl-7 h-9 text-sm text-slate-700"
                {...register("costPrice")}
              />
            </div>
            <span className="text-[10px] text-slate-400">Used for margin calculations</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="taxRate" className="text-xs font-semibold text-slate-700">
              GST Tax Rate (%)
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="taxRate"
                  type="number"
                  step="0.1"
                  min="0"
                  max="28"
                  className="pr-7 h-9 text-sm font-medium"
                  {...register("taxRate")}
                />
                <Percent className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
            {/* Quick GST Slabs */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_GST_RATES.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setValue("taxRate", rate)}
                  className={`text-[10px] px-2 py-0.5 rounded font-medium transition ${
                    Number(currentTaxRate) === rate
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
            {errors.taxRate && (
              <p className="text-[11px] text-red-500">{errors.taxRate.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: INVENTORY, HSN & BARCODE */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Boxes className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Inventory & Barcode Tracking</h3>
            <p className="text-xs text-slate-500">Stock quantities, low inventory alerts, and HSN code</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="stockQty" className="text-xs font-semibold text-slate-700">
              Current Stock Quantity
            </Label>
            <Input
              id="stockQty"
              type="number"
              step="0.01"
              placeholder="e.g. 100"
              className="h-9 text-sm"
              {...register("stockQty")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lowStockAlert" className="text-xs font-semibold text-slate-700">
              Low Stock Alert Limit
            </Label>
            <Input
              id="lowStockAlert"
              type="number"
              step="0.01"
              placeholder="e.g. 10"
              className="h-9 text-sm"
              {...register("lowStockAlert")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hsnCode" className="text-xs font-semibold text-slate-700">
              HSN / SAC Code
            </Label>
            <Input
              id="hsnCode"
              placeholder="e.g. 1905, 9987"
              className="h-9 text-sm font-mono"
              {...register("hsnCode")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="barcode" className="text-xs font-semibold text-slate-700">
              Barcode / SKU
            </Label>
            <div className="relative">
              <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="barcode"
                placeholder="Scan or enter code"
                className="pl-8 h-9 text-sm font-mono"
                {...register("barcode")}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: DYNAMIC SHOP-SPECIFIC FIELDS */}
      {template.productFields && template.productFields.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50/40 via-white to-indigo-50/30 rounded-xl border border-blue-200/70 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {template.name} Details
                </h3>
                <p className="text-xs text-slate-500">
                  Dynamic attributes saved into product metadata
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-xs font-medium">
              Shop Type: {template.id}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {template.productFields.map((fieldDef: ProductFieldDefinition) => {
              const fieldName = `metadata.${fieldDef.name}` as const;
              const currentValue = metadataValues?.[fieldDef.name] ?? "";

              return (
                <div key={fieldDef.name} className="space-y-1.5">
                  <Label
                    htmlFor={`dynamic-${fieldDef.name}`}
                    className="text-xs font-semibold text-slate-700 flex items-center gap-1"
                  >
                    {fieldDef.label}
                    {fieldDef.required && <span className="text-red-500">*</span>}
                  </Label>

                  {fieldDef.type === "select" && fieldDef.options ? (
                    <Select
                      value={currentValue ? String(currentValue) : ""}
                      onValueChange={(val) => {
                        setValue(`metadata.${fieldDef.name}`, val, {
                          shouldDirty: true,
                        });
                      }}
                    >
                      <SelectTrigger
                        id={`dynamic-${fieldDef.name}`}
                        className="h-9 text-sm bg-white"
                      >
                        <SelectValue placeholder={fieldDef.placeholder || `Select ${fieldDef.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldDef.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : fieldDef.type === "number" ? (
                    <Input
                      id={`dynamic-${fieldDef.name}`}
                      type="number"
                      step="any"
                      placeholder={fieldDef.placeholder || "0"}
                      className="h-9 text-sm bg-white"
                      value={currentValue}
                      onChange={(e) => {
                        const val = e.target.value === "" ? undefined : Number(e.target.value);
                        setValue(`metadata.${fieldDef.name}`, val, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  ) : fieldDef.type === "date" ? (
                    <Input
                      id={`dynamic-${fieldDef.name}`}
                      type="date"
                      className="h-9 text-sm bg-white"
                      value={currentValue}
                      onChange={(e) => {
                        setValue(`metadata.${fieldDef.name}`, e.target.value, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  ) : (
                    <Input
                      id={`dynamic-${fieldDef.name}`}
                      type="text"
                      placeholder={fieldDef.placeholder || `Enter ${fieldDef.label.toLowerCase()}`}
                      className="h-9 text-sm bg-white"
                      value={currentValue}
                      onChange={(e) => {
                        setValue(`metadata.${fieldDef.name}`, e.target.value, {
                          shouldDirty: true,
                        });
                      }}
                    />
                  )}

                  {fieldDef.description && (
                    <span className="text-[10px] text-slate-400 block">
                      {fieldDef.description}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FORM ACTIONS */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs h-9"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-500/20"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving Product...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              {isEditing ? "Update Product" : "Save Product"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
