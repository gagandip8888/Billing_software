"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ImportProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportProductsDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportProductsDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped?: number;
    totalRows?: number;
    errors: string[];
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setResult(null);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Please select an Excel or CSV file first");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/products/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to import products");
      }

      setResult(data);
      if (data.imported > 0) {
        toast.success(`Successfully imported ${data.imported} products!`);
        if (onSuccess) onSuccess();
        router.refresh();
      } else {
        toast.error("No products were imported. Check the errors list.");
      }
    } catch (err: any) {
      toast.error(err.message || "Import failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isUploading) {
          onOpenChange(val);
          if (!val) handleReset();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Import Products
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Bulk upload products using Excel or CSV file
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Template Download Card */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-800">
                Need the standard template?
              </span>
              <p className="text-[11px] text-slate-500">
                Columns: Name, Price, CostPrice, TaxRate, Category, StockQty, Barcode
              </p>
            </div>
            <a
              href="/templates/products-template.xlsx"
              download="products-template.xlsx"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 text-xs shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              Download
            </a>
          </div>

          {/* File Picker / Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
              selectedFile
                ? "border-emerald-300 bg-emerald-50/30"
                : "border-slate-300 hover:border-blue-400 bg-white"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-2" />
                <span className="text-sm font-bold text-slate-900 truncate max-w-[280px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB · Click to change file
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-semibold text-slate-700">
                  Click to select file (.xlsx, .xls, .csv)
                </span>
                <span className="text-[11px] text-slate-400 mt-1">
                  Product IDs will be automatically assigned
                </span>
              </div>
            )}
          </div>

          {/* Result / Summary Section */}
          {result && (
            <div className="space-y-2">
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  result.imported > 0
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {result.imported > 0 ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  )}
                  <span className="font-semibold">
                    Imported {result.imported} product{result.imported === 1 ? "" : "s"}
                    {result.skipped !== undefined && result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}
                  </span>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg max-h-36 overflow-y-auto space-y-1 text-[11px] text-red-700">
                  <span className="font-bold block">
                    Errors ({result.errors.length}):
                  </span>
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            className="text-xs"
          >
            Close
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
          >
            {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isUploading ? "Importing..." : "Upload & Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
