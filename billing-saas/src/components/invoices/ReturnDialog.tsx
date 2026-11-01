"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface ReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: {
    id: string;
    invoiceNo: string;
    items: Array<{
      id: string;
      productId?: string | null;
      name: string;
      qty: number;
      price: number;
      total: number;
      size?: string | null;
      color?: string | null;
    }>;
  } | null;
  onReturnSuccess?: (data: any) => void;
}

export function ReturnDialog({
  open,
  onOpenChange,
  invoice,
  onReturnSuccess,
}: ReturnDialogProps) {
  // Store return quantities mapped by item id
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});
  const [refundMode, setRefundMode] = useState<string>("CREDIT_NOTE");
  const [reason, setReason] = useState<string>("WRONG_SIZE");
  const [customReason, setCustomReason] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when invoice opens
  React.useEffect(() => {
    if (invoice) {
      setReturnQtys({});
      setRefundMode("CREDIT_NOTE");
      setReason("WRONG_SIZE");
      setCustomReason("");
    }
  }, [invoice]);

  if (!invoice) return null;

  // Calculate return items and total
  const itemsToReturn = invoice.items
    .map((item) => {
      const q = Number(returnQtys[item.id]) || 0;
      if (q <= 0) return null;
      const unitPrice = Number(item.price) || 0;
      return {
        id: item.id,
        productId: item.productId,
        name: item.name,
        qty: q,
        price: unitPrice,
        total: Math.round(q * unitPrice * 100) / 100,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    productId?: string | null;
    name: string;
    qty: number;
    price: number;
    total: number;
  }>;

  const totalReturnAmount = itemsToReturn.reduce((acc, it) => acc + it.total, 0);

  function handleQtyChange(itemId: string, maxQty: number, val: string) {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed < 0) {
      setReturnQtys((prev) => ({ ...prev, [itemId]: 0 }));
      return;
    }
    const clamped = Math.min(parsed, maxQty);
    setReturnQtys((prev) => ({ ...prev, [itemId]: clamped }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (itemsToReturn.length === 0) {
      toast.error("Please enter a return quantity for at least one item.");
      return;
    }

    setIsLoading(true);
    try {
      const finalReason = reason === "OTHER" && customReason.trim() ? customReason.trim() : reason;
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice!.id,
          itemsToReturn: itemsToReturn.map((it) => ({
            productId: it.productId,
            name: it.name,
            qty: it.qty,
            price: it.price,
            total: it.total,
          })),
          refundMode,
          reason: finalReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process sales return");
      }

      toast.success(
        `Sales Return ${data.salesReturn.returnNo} processed! ${
          data.creditNote ? `Credit Note ${data.creditNote.creditNoteNo} generated.` : "Refund logged."
        }`
      );
      onOpenChange(false);
      if (onReturnSuccess) onReturnSuccess(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-800">
                  Return / Exchange Items
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Bill #{invoice.invoiceNo} — select items and quantities being returned
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3 text-center">Billed Qty</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-right">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item) => {
                    const currentVal = returnQtys[item.id] !== undefined ? returnQtys[item.id] : "";
                    const clothingAttr = [item.size, item.color].filter(Boolean).join(", ");

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-800">{item.name}</div>
                          {clothingAttr && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal text-slate-500">
                              {clothingAttr}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {Number(item.qty)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          ₹{Number(item.price).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            max={Number(item.qty)}
                            placeholder="0"
                            className="h-8 w-20 text-xs text-right ml-auto font-bold"
                            value={currentVal}
                            onChange={(e) => handleQtyChange(item.id, Number(item.qty), e.target.value)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Refund Total Summary */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50/70 border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-950">Total Return Refund Value:</span>
              <span className="font-mono font-black text-indigo-950 text-base">
                ₹{totalReturnAmount.toFixed(2)}
              </span>
            </div>

            {/* Refund Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="refundMode" className="text-xs font-semibold text-slate-700">
                  Refund Method <span className="text-red-500">*</span>
                </Label>
                <Select value={refundMode} onValueChange={setRefundMode}>
                  <SelectTrigger id="refundMode" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CREDIT_NOTE">
                      Credit Note (Store Credit / Voucher)
                    </SelectItem>
                    <SelectItem value="CASH">Cash Refund</SelectItem>
                    <SelectItem value="UPI">UPI / Digital Refund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-semibold text-slate-700">
                  Return Reason <span className="text-red-500">*</span>
                </Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason" className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WRONG_SIZE">Wrong Size / Fit</SelectItem>
                    <SelectItem value="WRONG_COLOR">Wrong Color / Style</SelectItem>
                    <SelectItem value="DAMAGED">Damaged / Defective Garment</SelectItem>
                    <SelectItem value="CHANGED_MIND">Customer Changed Mind</SelectItem>
                    <SelectItem value="OTHER">Other Reason</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {reason === "OTHER" && (
              <div className="space-y-1.5">
                <Label htmlFor="customReason" className="text-xs font-semibold text-slate-700">
                  Specify Reason
                </Label>
                <Input
                  id="customReason"
                  placeholder="Describe reason for return..."
                  className="h-9 text-xs"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || itemsToReturn.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" /> Confirm Return (₹{totalReturnAmount.toFixed(2)})
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
