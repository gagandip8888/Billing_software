"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  Barcode,
  ArrowUpDown,
  Filter,
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SerializedProduct {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  category?: string | null;
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
  shopType?: string;
  onAddProduct?: () => void;
  onEditProduct?: (product: SerializedProduct) => void;
}

export function ProductTable({
  initialProducts,
  shopType,
  onAddProduct,
  onEditProduct,
}: ProductTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState<SerializedProduct[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [deletingProduct, setDeletingProduct] = useState<SerializedProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync if initialProducts changes (e.g. from server revalidation)
  React.useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Derive unique categories from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        const matchesBarcode = product.barcode?.toLowerCase().includes(q);
        const matchesHsn = product.hsnCode?.toLowerCase().includes(q);
        const matchesCat = product.category?.toLowerCase().includes(q);

        // Also check metadata fields
        let matchesMeta = false;
        if (product.metadata && typeof product.metadata === "object") {
          matchesMeta = Object.values(product.metadata).some((val) =>
            String(val).toLowerCase().includes(q)
          );
        }

        if (
          !matchesName &&
          !matchesDesc &&
          !matchesBarcode &&
          !matchesHsn &&
          !matchesCat &&
          !matchesMeta
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "all") {
        if (product.category !== selectedCategory) {
          return false;
        }
      }

      // Stock status filter
      if (stockFilter === "low_stock") {
        if (
          product.stockQty === null ||
          product.stockQty === undefined ||
          product.lowStockAlert === null ||
          product.lowStockAlert === undefined ||
          product.stockQty > product.lowStockAlert
        ) {
          return false;
        }
      } else if (stockFilter === "in_stock") {
        if (product.stockQty === null || product.stockQty === undefined || product.stockQty <= 0) {
          return false;
        }
      } else if (stockFilter === "out_of_stock") {
        if (product.stockQty !== null && product.stockQty !== undefined && product.stockQty > 0) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

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
      {/* FILTER & SEARCH BAR */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search product, barcode, HSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="w-40 hidden sm:block">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-36 hidden md:block">
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Inventory</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low_stock">Low Stock Alert</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onAddProduct ? (
            <Button
              onClick={onAddProduct}
              className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add Product
            </Button>
          ) : (
            <Link href="/products/new">
              <Button className="h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Add Product
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/75 border-b border-slate-200">
            <TableRow>
              <TableHead className="w-[320px] text-xs font-bold text-slate-700">
                Item & Specifications
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Price (Unit)
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                Stock Status
              </TableHead>
              <TableHead className="text-xs font-bold text-slate-700">
                GST Tax
              </TableHead>
              <TableHead className="w-[80px] text-right text-xs font-bold text-slate-700">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
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
              filteredProducts.map((product) => {
                const isLowStock =
                  product.stockQty !== null &&
                  product.stockQty !== undefined &&
                  product.lowStockAlert !== null &&
                  product.lowStockAlert !== undefined &&
                  product.stockQty <= product.lowStockAlert;

                const metaSnippets = getMetadataSnippet(product.metadata);

                return (
                  <TableRow
                    key={product.id}
                    className="hover:bg-slate-50/60 transition group"
                  >
                    {/* Item Name & Details */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2">
                          <span>{product.name}</span>
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

                        {/* Barcode & HSN tags */}
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

                        {/* Dynamic Shop Metadata Badges */}
                        {metaSnippets && metaSnippets.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {metaSnippets.map((meta, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] bg-blue-50/80 text-blue-700 px-2 py-0.5 rounded font-medium border border-blue-100"
                              >
                                <span className="opacity-70 capitalize">
                                  {meta.key}:
                                </span>
                                <span className="font-semibold">{meta.val}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
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

                    {/* Price & Cost */}
                    <TableCell className="align-top py-3.5">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-slate-900">
                          ₹{Number(product.price).toFixed(2)}
                          <span className="text-xs font-normal text-slate-500 ml-1">
                            / {product.unit}
                          </span>
                        </div>
                        {product.costPrice !== null &&
                          product.costPrice !== undefined && (
                            <div className="text-[11px] text-slate-500">
                              Cost: ₹{Number(product.costPrice).toFixed(2)}
                            </div>
                          )}
                      </div>
                    </TableCell>

                    {/* Stock Status */}
                    <TableCell className="align-top py-3.5">
                      {product.stockQty !== null &&
                      product.stockQty !== undefined ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-semibold ${
                                isLowStock
                                  ? "text-amber-600"
                                  : Number(product.stockQty) === 0
                                  ? "text-red-600"
                                  : "text-slate-800"
                              }`}
                            >
                              {Number(product.stockQty)} {product.unit}
                            </span>
                            {isLowStock && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                Low
                              </span>
                            )}
                          </div>
                          {product.lowStockAlert !== null &&
                            product.lowStockAlert !== undefined && (
                              <div className="text-[10px] text-slate-400">
                                Alert at: {Number(product.lowStockAlert)}{" "}
                                {product.unit}
                              </div>
                            )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">
                          Not tracked
                        </span>
                      )}
                    </TableCell>

                    {/* Tax Rate */}
                    <TableCell className="align-top py-3.5">
                      <Badge
                        variant="secondary"
                        className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200"
                      >
                        {Number(product.taxRate)}% GST
                      </Badge>
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
                            Edit Item
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-slate-900">
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              Are you sure you want to remove &quot;{deletingProduct?.name}&quot; from
              your catalog? This product will be archived and will not appear
              in billing options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="text-xs h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={() => deletingProduct && handleDelete(deletingProduct)}
              className="text-xs h-9 bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
