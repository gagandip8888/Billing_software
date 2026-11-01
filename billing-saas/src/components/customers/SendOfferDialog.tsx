"use client";

import React, { useState } from "react";
import { MessageSquare, ExternalLink, Sparkles, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface SendOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    name: string;
    mobile: string;
  } | null;
  shopName?: string;
}

export function SendOfferDialog({
  open,
  onOpenChange,
  customer,
  shopName = "our shop",
}: SendOfferDialogProps) {
  const [offerText, setOfferText] = useState(
    "Flat 20% OFF on all new arrivals this weekend only! Use code FESTIVE20"
  );

  if (!customer) return null;

  // Clean phone number (keep digits, default to India +91 if 10 digits)
  const rawDigits = customer.mobile.replace(/\D/g, "");
  const formattedPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;

  const fullMessage = `Hi ${customer.name}, ${shopName} has a special offer: ${offerText}. Visit us today!`;

  function handleSendWhatsApp() {
    const encoded = encodeURIComponent(fullMessage);
    const url = `https://wa.me/${formattedPhone}?text=${encoded}`;
    window.open(url, "_blank");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Send WhatsApp Offer
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Send an exclusive promotional offer to {customer.name} ({customer.mobile})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Offer Description / Promotion
            </Label>
            <Textarea
              rows={3}
              placeholder="e.g. Flat 20% off on all items this weekend! Buy 2 Get 1 Free..."
              value={offerText}
              onChange={(e) => setOfferText(e.target.value)}
              className="text-xs resize-none"
            />
          </div>

          {/* Live Message Preview */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              Message Preview:
            </span>
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs text-slate-800 leading-relaxed font-sans">
              &ldquo;{fullMessage}&rdquo;
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSendWhatsApp}
            disabled={!offerText.trim() || !formattedPhone}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5"
          >
            <Send className="h-3.5 w-3.5" /> Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
