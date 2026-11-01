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
import { PauseCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface HoldBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getBillPayload: () => {
    customerName?: string;
    customerMobile?: string;
    payload: any;
  };
  onHoldSuccess: () => void;
}

export function HoldBillDialog({
  open,
  onOpenChange,
  getBillPayload,
  onHoldSuccess,
}: HoldBillDialogProps) {
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleHoldBill() {
    setIsLoading(true);
    try {
      const { customerName, customerMobile, payload } = getBillPayload();

      // Check if bill has any items
      if (!payload.items || payload.items.length === 0 || !payload.items.some((i: any) => i.name?.trim())) {
        toast.error("Cannot hold an empty bill. Add at least one item.");
        setIsLoading(false);
        return;
      }

      const res = await fetch("/api/hold-bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName || payload.customerName || "Walk-in Customer",
          customerMobile: customerMobile || payload.customerMobile || null,
          note: note.trim() || undefined,
          payload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to hold bill");
      }

      toast.success("Bill held. Resume from Hold Bills menu.");
      setNote("");
      onOpenChange(false);
      onHoldSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong holding bill");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <PauseCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-800">
                Hold Current Bill
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Park this bill to attend to the next customer. You can resume it anytime.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="holdNote" className="text-xs font-semibold text-slate-700">
              Note / Reference (Optional)
            </Label>
            <Input
              id="holdNote"
              placeholder="e.g. Counter 2 - Waiting for cash / Bag #12"
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
            type="button"
            size="sm"
            onClick={handleHoldBill}
            disabled={isLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold gap-1.5"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Holding...
              </>
            ) : (
              <>
                <PauseCircle className="h-3.5 w-3.5" /> Confirm Hold
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
