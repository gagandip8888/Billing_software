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
import { PaymentMode } from "@prisma/client";
import { IndianRupee, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PaymentReceivedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    id: string;
    name: string;
    mobile: string;
    creditBalance: number;
  } | null;
  onPaymentRecorded: () => void;
}

export function PaymentReceivedDialog({
  open,
  onOpenChange,
  customer,
  onPaymentRecorded,
}: PaymentReceivedDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(PaymentMode.CASH);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // When customer changes, prefill amount with their full pending balance
  React.useEffect(() => {
    if (customer) {
      setAmount(customer.creditBalance > 0 ? String(customer.creditBalance) : "");
      setReference("");
      setNote("");
      setPaymentMode(PaymentMode.CASH);
    }
  }, [customer]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer) return;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid positive payment amount");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/udhari/${customer.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          paymentMode,
          reference: reference.trim() || undefined,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      toast.success(
        `Received ₹${numAmount} from ${customer.name}. New pending: ₹${data.newCreditBalance.toFixed(2)}`
      );
      onOpenChange(false);
      onPaymentRecorded();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  }

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <IndianRupee className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-800">
                  Record Udhari Payment
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Settle pending khata balance for <span className="font-semibold text-slate-700">{customer.name}</span> ({customer.mobile})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Outstanding Balance Banner */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100 text-xs">
              <span className="text-red-700 font-medium">Current Total Due:</span>
              <span className="font-mono font-bold text-red-700 text-sm">
                ₹{Number(customer.creditBalance).toFixed(2)}
              </span>
            </div>

            {/* Amount Input */}
            <div className="space-y-1.5">
              <Label htmlFor="payAmount" className="text-xs font-semibold text-slate-700">
                Amount Received (₹) <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">₹</span>
                <Input
                  id="payAmount"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="pl-7 h-9 text-xs font-bold text-emerald-700"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400">
                <span>Enter partial or full payment</span>
                <button
                  type="button"
                  onClick={() => setAmount(String(customer.creditBalance))}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Clear Full Balance (₹{customer.creditBalance})
                </button>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <Label htmlFor="payMode" className="text-xs font-semibold text-slate-700">
                Payment Channel <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentMode}
                onValueChange={(val) => setPaymentMode(val as PaymentMode)}
              >
                <SelectTrigger id="payMode" className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMode.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMode.UPI}>UPI / GooglePay / PhonePe</SelectItem>
                  <SelectItem value={PaymentMode.CARD}>Debit / Credit Card</SelectItem>
                  <SelectItem value={PaymentMode.BANK_TRANSFER}>Bank Transfer (NEFT/IMPS)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reference */}
            <div className="space-y-1.5">
              <Label htmlFor="payRef" className="text-xs font-semibold text-slate-700">
                Reference / UTR / Cheque No. (Optional)
              </Label>
              <Input
                id="payRef"
                placeholder="e.g. UPI-9284729103 or CHQ-4821"
                className="h-9 text-xs font-mono"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <Label htmlFor="payNote" className="text-xs font-semibold text-slate-700">
                Remarks / Note (Optional)
              </Label>
              <Input
                id="payNote"
                placeholder="e.g. Paid in shop by brother"
                className="h-9 text-xs"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
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
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Save Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
