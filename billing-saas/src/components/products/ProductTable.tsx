"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Barcode,
  ChevronDown,
  ChevronRight,
  Tag,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface SerializedProduct {
  id: string;
  productId?: string | null;
  tenantId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  size?: string | null;
  color?: string | null;
  brand?: string | null;
  mrp?: number | null;
  variantGroupId?: string | null;
  price: number;
  costPrice?: number | null;
  taxRate: number;
  hsnCode?: string | null;
  unit: string;
  stockQty?: number | null;
  lowStockAlert?: number | null;
  barcode?: string | null;
  metadata?: Record<string, any> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductTableProps {
  initialProducts: SerializedProduct[];
  searchQuery?: string;
  shopType?: string;
  highlightId?: string | null;
  onAddProduct?: () => void;
  onEditProduct?: (product: SerializedProduct) => void;
}

export function ProductTable({
  initialProducts,
  searchQuery = "",
  shopType,
  highlightId,
  onAddProduct,
  onEditProduct,
}: ProductTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [deletingProduct, setDeletingProduct] = useState<SerializedProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-scroll and highlight row when highlightId is present
  React.useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`product-row-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightId, products]);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Sync if initialProducts changes (e.g. from server revalidation)
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  // Client-side filtering by search query
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;

    return products.filter((product) => {
      const matchesName = product.name.toLowerCase().includes(q);
      const matchesDesc = product.description?.toLowerCase().includes(q);
      const matchesBarcode = product.barcode?.toLowerCase().includes(q);
      const matchesHsn = product.hsnCode?.toLowerCase().includes(q);
      const matchesCat = product.category?.toLowerCase().includes(q);
      const matchesBrand = product.brand?.toLowerCase().includes(q);
      const matchesSize = product.size?.toLowerCase().includes(q);
      const matchesColor = product.color?.toLowerCase().includes(q);
      const matchesId = product.productId?.toLowerCase().includes(q);

      // Also check metadata fields
      let matchesMeta = false;
      if (product.metadata && typeof product.metadata === "object") {
        matchesMeta = Object.values(product.metadata).some((val) =>
          String(val).toLowerCase().includes(q)
        );
      }

      return (
        matchesName ||
        matchesDesc ||
        matchesBarcode ||
        matchesHsn ||
        matchesCat ||
        matchesBrand ||
        matchesSize ||
        matchesColor ||
        matchesId ||
        matchesMeta
      );
    });
  }, [products, searchQuery]);

  // Group products by variantGroupId
  const groupedProducts = useMemo(() => {
    const groups: Array<{
      key: string;
      isGroup: boolean;
      mainProduct: SerializedProduct;
      variants: SerializedProduct[];
      totalStock: number;
    }> = [];

    const groupMap = new Map<string, SerializedProduct[]>();
    const nonGrouped: SerializedProduct[] = [];

    filteredProducts.forEach((p) => {
      if (p.variantGroupId) {
        if (!groupMap.has(p.variantGroupId)) {
          groupMap.set(p.variantGroupId, []);
        }
        groupMap.get(p.variantGroupId)!.push(p);
      } else {
        nonGrouped.push(p);
      }
    });

    groupMap.forEach((variants, vgid) => {
      if (variants.length > 1) {
        const totalStock = variants.reduce(
          (sum, v) => sum + (Number(v.stockQty) || 0),
          0
        );
        groups.push({
          key: vgid,
          isGroup: true,
          mainProduct: variants[0],
          variants,
          totalStock,
        });
      } else {
        nonGrouped.push(variants[0]);
      }
    });

    nonGrouped.forEach((p) => {
      groups.push({
        key: p.id,
        isGroup: false,
        mainProduct: p,
        variants: [p],
        totalStock: Number(p.stockQty) || 0,
      });
    });

    return groups;
  }, [filteredProducts]);

  // All selectable product IDs
  const allSelectableIds = useMemo(() => {
    return filteredProducts.map((p) => p.id);
  }, [filteredProducts]);

  const isAllSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every((id) => selectedIds.has(id));

  function handleToggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allSelectableIds));
    }
  }

  function handleToggleSingle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleGroup(group: { variants: SerializedProduct[] }) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allInGroupSelected = group.variants.every((v) => next.has(v.id));
      if (allInGroupSelected) {
        group.variants.forEach((v) => next.delete(v.id));
      } else {
        group.variants.forEach((v) => next.add(v.id));
      }
      return next;
    });
  }

  async function handleBulkDeleteConfirm() {
    if (selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await fetch("/api/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete products");
      }

      toast.success(`${selectedIds.size} product(s) deleted successfully`);
      const deletedSet = new Set(selectedIds);
      setProducts((prev) => prev.filter((p) => !deletedSet.has(p.id)));
      setSelectedIds(new Set());
      setShowBulkDeleteDialog(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete products");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleDelete(product: SerializedProduct) {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      toast.success(`"${product.name}" removed from catalog`);
      // Update local state
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("products:updated"));
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
      setDeletingProduct(null);
    }
  }

  // Helper to extract key metadata values for display
  function getMetadataSnippet(metadata?: Record<string, any> | null) {
    if (!metadata || typeof metadata !== "object") return null;
    const entries = Object.entries(metadata).filter(
      ([_, val]) => val !== undefined && val !== null && val !== ""
    );
    if (entries.length === 0) return null;

    return entries.slice(0, 3).map(([key, val]) => ({
      key,
      val: String(val),
    }));
  }

  return (
    <div className="space-y-4">
      {/* BULK ACTION BAR */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-red-50/90 border border-red-200 rounded-xl shadow-xs transition-all">
          <div className="flex items-center gap-2.5 text-xs font-bold text-red-900">
            <span className="flex h-2.5 w-2.5 rounded-full bg-red-600 animate-pulse" />
            <span>
              {selectedIds.size} of {allSelectableIds.length} product{selectedIds.size > 1 ? "s" : ""} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkDeleting}
              className="h-8 text-xs border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold"
            >
              Deselect All
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
              disabled={isBulkDeleting}
              className="h-8 text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs flex items-center gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Selected ({selectedIds.size})
            </Button>
          </div>
        </div>
      )}

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/75 border-b border-slate-200">
            <TableRow>
              {/* Select All Checkbox */}
              <TableHead className="w-[44px] text-center px-3">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  aria-label="Select all products"
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 mt-1"
                />
              </TableHead>
              <TableHead className="w-[90px] text-xs font-bold text-slate-700">
                ID
              </TableHead>
              <TableHead className="w-[300px] text-xs font-bold text-slate-700">
                Item & Specifications
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Brand
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Size / Colour
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                MRP / Price
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Stock Status
              </TableHead>
              <TableHead className="w-[80px] text-right text-xs font-bold text-slate-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="h-64 text-center py-12"
                >
                  <div className="max-w-sm mx-auto flex flex-col items-center">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <Package className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {products.length === 0
                        ? "No products added yet"
                        : "No matching products found"}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 mb-4 text-center">
                      {products.length === 0
                        ? "Add products to start generating bills, tracking inventory, and scanning barcodes."
                        : "Try adjusting your search terms or filter criteria."}
                    </p>
                    {products.length === 0 && (
                      <Button
                        onClick={onAddProduct ? onAddProduct : () => router.push("/products/new")}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                      >
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Your First Product
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              groupedProducts.map((group) => {
                const product = group.mainProduct;
                const isExpanded = Boolean(expandedGroups[group.key]);

                const isLowStock =
                  product.stockQty !== null &&
                  product.stockQty !== undefined &&
                  product.lowStockAlert !== null &&
                  product.lowStockAlert !== undefined &&
                  product.stockQty <= product.lowStockAlert;

                const isHighlighted = highlightId === product.id;

                return (
                  <React.Fragment key={group.key}>
                    <TableRow
                      id={`product-row-${product.id}`}
                      className={`hover:bg-slate-50/60 transition group ${
                        isHighlighted ? "bg-amber-100/80 ring-2 ring-amber-500 shadow-md animate-pulse" : ""
                      }`}
                    >
                      {/* Checkbox Column */}
                      <TableCell className="w-[44px] text-center px-3 py-3.5 align-top">
                        <input
                          type="checkbox"
                          checked={
                            group.isGroup
                              ? group.variants.every((v) => selectedIds.has(v.id))
                              : selectedIds.has(product.id)
                          }
                          onChange={() =>
                            group.isGroup
                              ? handleToggleGroup(group)
                              : handleToggleSingle(product.id)
                          }
                          aria-label={`Select ${product.name}`}
                          className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 mt-0.5"
                        />
                      </TableCell>

                      {/* ID Column */}
                      <TableCell className="align-top py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs">
                          {product.productId || `#${product.id.slice(-4)}`}
                        </span>
                      </TableCell>

                      {/* Item Name & Details */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {group.isGroup && (
                              <button
                                type="button"
                                onClick={() => toggleGroup(group.key)}
                                className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-indigo-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}

                            <span className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition">
                              {product.name}
                            </span>

                            {group.isGroup && (
                              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold">
                                {group.variants.length} Variants
                              </Badge>
                            )}

                            {!product.isActive && (
                              <Badge variant="secondary" className="text-[10px]">
                                Inactive
                              </Badge>
                            )}
                          </div>

                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {product.description}
                            </p>
                          )}

                          {/* Barcode & HSN */}
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            {product.barcode && (
                              <span className="flex items-center gap-1 font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                <Barcode className="h-3 w-3" />
                                {product.barcode}
                              </span>
                            )}
                            {product.hsnCode && (
                              <span className="font-mono text-slate-500">
                                HSN: {product.hsnCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Brand */}
                      <TableCell className="align-top py-3.5">
                        {product.brand ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            <Tag className="h-3 w-3 text-slate-500" />
                            {product.brand}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Size / Colour */}
                      <TableCell className="align-top py-3.5">
                        {group.isGroup ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {group.variants.map((v) => (
                              <span
                                key={v.id}
                                className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100"
                              >
                                {v.size || "—"} {v.color ? `· ${v.color}` : ""} ({Number(v.stockQty) || 0})
                              </span>
                            ))}
                          </div>
                        ) : product.size || product.color ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {product.size && (
                              <Badge variant="outline" className="text-xs font-bold text-slate-800 bg-slate-50">
                                Size: {product.size}
                              </Badge>
                            )}
                            {product.color && (
                              <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                                {product.color}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>

                      {/* Category */}
                      <TableCell className="align-top py-3.5">
                        {product.category ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-normal text-slate-700 bg-slate-50 border-slate-200"
                          >
                            {product.category}
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Uncategorized
                          </span>
                        )}
                      </TableCell>

                      {/* Price & MRP */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold text-slate-900">
                            ₹{Number(product.price).toFixed(2)}
                            <span className="text-xs font-normal text-slate-500 ml-1">
                              / {product.unit}
                            </span>
                          </div>
                          {product.mrp && Number(product.mrp) > Number(product.price) && (
                            <div className="text-[11px] text-slate-400 line-through">
                              MRP: ₹{Number(product.mrp).toFixed(2)}
                            </div>
                          )}
                          {product.costPrice !== null &&
                            product.costPrice !== undefined && (
                              <div className="text-[10px] text-slate-500">
                                Cost: ₹{Number(product.costPrice).toFixed(2)}
                              </div>
                            )}
                        </div>
                      </TableCell>

                      {/* Stock Status */}
                      <TableCell className="align-top py-3.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-semibold ${
                                isLowStock
                                  ? "text-amber-600"
                                  : Number(group.totalStock) === 0
                                  ? "text-red-600"
                                  : "text-slate-800"
                              }`}
                            >
                              {group.totalStock} {product.unit}
                            </span>
                            {group.isGroup && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                total
                              </span>
                            )}
                            {isLowStock && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                Low
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-top py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem
                              onClick={() => {
                                if (onEditProduct) {
                                  onEditProduct(product);
                                } else {
                                  router.push(`/products/${product.id}/edit`);
                                }
                              }}
                              className="text-xs cursor-pointer"
                            >
                              <Edit className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingProduct(product)}
                              className="text-xs text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>

                    {/* EXPANDABLE CHILD VARIANTS ROW */}
                    {group.isGroup &&
                      isExpanded &&
                      group.variants.map((v, vIdx) => (
                        <TableRow
                          key={v.id}
                          className="bg-indigo-50/25 border-l-4 border-l-indigo-500 hover:bg-indigo-50/50"
                        >
                          {/* Checkbox Column for variant */}
                          <TableCell className="w-[44px] text-center px-3 py-2.5">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(v.id)}
                              onChange={() => handleToggleSingle(v.id)}
                              aria-label={`Select variant ${v.size || v.name}`}
                              className="h-3.5 w-3.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                            />
                          </TableCell>

                          <TableCell className="py-2.5 font-mono text-[11px] font-bold text-indigo-600">
                            {v.productId || "—"}
                          </TableCell>

                          <TableCell className="py-2.5 pl-8 text-xs font-medium text-slate-800">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">↳</span>
                              <Badge className="bg-indigo-600 text-white text-[10px]">
                                {v.size || `Variant #${vIdx + 1}`}
                              </Badge>
                              {v.color && (
                                <span className="text-[11px] text-slate-600">
                                  {v.color}
                                </span>
                              )}
                              {v.barcode && (
                                <span className="text-[10px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {v.barcode}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-slate-600">
                            {v.brand || "—"}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs font-semibold text-indigo-700">
                            {v.size} {v.color ? `· ${v.color}` : ""}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs text-slate-500">
                            {v.category || "—"}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs font-semibold text-slate-900">
                            ₹{Number(v.price).toFixed(2)}
                            {v.mrp && Number(v.mrp) > Number(v.price) && (
                              <span className="text-[10px] text-slate-400 line-through ml-1">
                                ₹{Number(v.mrp).toFixed(2)}
                              </span>
                            )}
                          </TableCell>

                          <TableCell className="py-2.5 text-xs font-semibold text-slate-700">
                            {Number(v.stockQty) || 0} {v.unit}
                          </TableCell>

                          <TableCell className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (onEditProduct) {
                                    onEditProduct(v);
                                  } else {
                                    router.push(`/products/${v.id}/edit`);
                                  }
                                }}
                                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingProduct(v)}
                                className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* BULK DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={(open) => !isBulkDeleting && setShowBulkDeleteDialog(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Delete {selectedIds.size} Selected Product{selectedIds.size > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to delete the {selectedIds.size} selected product{selectedIds.size > 1 ? "s" : ""} from your catalog?
              These products will be archived and will not appear in billing options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting} className="text-xs h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isBulkDeleting}
              onClick={handleBulkDeleteConfirm}
              className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isBulkDeleting ? "Deleting..." : `Delete ${selectedIds.size} Product${selectedIds.size > 1 ? "s" : ""}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* REAL-LIFE PRODUCT DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && !isDeleting && setDeletingProduct(null)}
      >
        <AlertDialogContent className="max-w-md border-red-200">
          <AlertDialogHeader className="space-y-3">
            <div className="h-11 w-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto sm:mx-0 shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed space-y-2">
              <span>
                Are you sure you want to delete{" "}
                <strong className="text-slate-900 font-bold">&quot;{deletingProduct?.name}&quot;</strong>?
                This action will remove the item from your inventory.
              </span>
              <span className="block text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                ⚠️ Existing bills containing this product will retain their historical records.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-3">
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeletingProduct(null)}
              className="text-xs h-9 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => deletingProduct && handleDelete(deletingProduct)}
              className="text-xs h-9 bg-red-600 hover:bg-red-700 font-semibold shadow-md shadow-red-500/20 flex items-center gap-1.5"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
