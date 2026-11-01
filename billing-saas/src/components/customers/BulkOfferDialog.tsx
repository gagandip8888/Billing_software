"use client";

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  Users,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  SkipForward,
  ChevronRight,
  Check,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { SerializedCustomer } from "./CustomersClient";

interface BulkOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: SerializedCustomer[];
  businessName: string;
}

export function BulkOfferDialog({
  open,
  onOpenChange,
  customers,
  businessName,
}: BulkOfferDialogProps) {
  const [offerMessage, setOfferMessage] = useState(
    "Diwali Dhamaka! Flat 20% off on all items this week! Visit us today to claim your discount."
  );
  const [mode, setMode] = useState<"CONFIG" | "SENDING" | "FINISHED">("CONFIG");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sentCustomerIds, setSentCustomerIds] = useState<Set<string>>(new Set());

  // Filter customers with valid 10+ digit mobile numbers
  const validCustomers = useMemo(() => {
    return customers.filter((c) => {
      const digits = c.mobile.replace(/\D/g, "");
      return digits.length >= 10;
    });
  }, [customers]);

  // Reset state when dialog is closed
  React.useEffect(() => {
    if (!open) {
      setMode("CONFIG");
      setCurrentIndex(0);
      setSentCustomerIds(new Set());
    }
  }, [open]);

  const currentCustomer = validCustomers[currentIndex] || null;

  function buildWhatsAppUrl(customer: SerializedCustomer): string {
    const rawDigits = customer.mobile.replace(/\D/g, "");
    const formattedPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const text = `Hi ${customer.name}, ${businessName} has a special offer: ${offerMessage}`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
  }

  function handleStartSending() {
    if (validCustomers.length === 0) return;
    setMode("SENDING");
    setCurrentIndex(0);
  }

  function handleSendCurrent() {
    if (!currentCustomer) return;
    const url = buildWhatsAppUrl(currentCustomer);
    window.open(url, "_blank");

    // Mark as sent
    setSentCustomerIds((prev) => new Set(prev).add(currentCustomer.id));

    // Advance to next customer if available
    if (currentIndex + 1 < validCustomers.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setMode("FINISHED");
    }
  }

  function handleSendDirect(customer: SerializedCustomer) {
    const url = buildWhatsAppUrl(customer);
    window.open(url, "_blank");
    setSentCustomerIds((prev) => new Set(prev).add(customer.id));
  }

  function handleSkipCurrent() {
    if (currentIndex + 1 < validCustomers.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setMode("FINISHED");
    }
  }

  const sentCount = sentCustomerIds.size;
  const progressPercent =
    validCustomers.length > 0 ? Math.round((sentCount / validCustomers.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <DialogHeader className="shrink-0 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Send WhatsApp Offer to All Customers</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Bulk Queue
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Send promotional discount broadcasts to your customer list safely one by one.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
          {mode === "CONFIG" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-800">
                  Offer Message (संदेश):
                </Label>
                <Textarea
                  rows={4}
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="e.g. Diwali Dhamaka! Flat 20% off on all items this week!"
                  className="text-xs resize-none border-slate-300 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Broadcast Notice Card */}
              <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Target Audience:
                  </span>
                  <span className="bg-emerald-200/70 text-emerald-950 px-2 py-0.5 rounded-full text-[11px]">
                    {validCustomers.length} Customers with Mobile
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  This will prepare a sequential sending queue for <strong>{validCustomers.length} customers</strong>.
                  WhatsApp opens smoothly for each customer with a single click, preventing browser freezing or tab crashes.
                </p>
              </div>

              {/* Live Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Customer Message Preview:
                </span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed font-sans">
                  &ldquo;Hi <strong className="text-slate-900">Rahul Sharma</strong>, {businessName} has a special offer: {offerMessage}&rdquo;
                </div>
              </div>
            </div>
          )}

          {mode === "SENDING" && currentCustomer && (
            <div className="space-y-4">
              {/* Progress Bar Header */}
              <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">
                    Sending {currentIndex + 1} of {validCustomers.length}...
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {sentCount} Sent ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Current Customer Card */}
              <div className="bg-white border-2 border-emerald-500/60 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Next Customer in Queue
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      {currentCustomer.name}
                    </h4>
                    <p className="text-xs font-mono text-slate-600">
                      Mobile: {currentCustomer.mobile}
                    </p>
                  </div>
                  {sentCustomerIds.has(currentCustomer.id) && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 gap-1 text-[11px]">
                      <Check className="h-3 w-3" /> Sent
                    </Badge>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-700 border border-slate-200">
                  <p className="line-clamp-2">
                    &ldquo;Hi {currentCustomer.name}, {businessName} has a special offer: {offerMessage}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    onClick={handleSendCurrent}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 shadow-sm shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Send to {currentCustomer.name.split(" ")[0]} &amp; Next</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipCurrent}
                    className="text-xs h-10 border-slate-300 text-slate-600 hover:bg-slate-100"
                    title="Skip this customer"
                  >
                    <SkipForward className="h-4 w-4 mr-1" /> Skip
                  </Button>
                </div>
              </div>

              {/* Customer List Quick Access */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  All Customers Queue ({validCustomers.length}):
                </span>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs bg-white">
                  {validCustomers.map((c, idx) => {
                    const isSent = sentCustomerIds.has(c.id);
                    const isCurrent = idx === currentIndex;
                    return (
                      <div
                        key={c.id}
                        className={`flex items-center justify-between p-2.5 transition ${
                          isCurrent ? "bg-emerald-50/50 font-semibold" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="truncate text-slate-800">
                            {idx + 1}. {c.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{c.mobile}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              <Check className="h-3 w-3" /> Sent
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendDirect(c)}
                              className="h-7 text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            >
                              Send
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {mode === "FINISHED" && (
            <div className="py-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Bulk Broadcast Completed!</h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  You have dispatched WhatsApp promotional offers to <strong>{sentCount} customers</strong>.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setMode("CONFIG");
                    setCurrentIndex(0);
                    setSentCustomerIds(new Set());
                  }}
                  className="text-xs h-9"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Start New Offer
                </Button>
                <Button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "CONFIG" && (
          <DialogFooter className="shrink-0 pt-3 border-t border-slate-100 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 border-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={validCustomers.length === 0 || !offerMessage.trim()}
              onClick={handleStartSending}
              className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Start Sending ({validCustomers.length} Customers)</span>
            </Button>
          </DialogFooter>
        )}

        {mode === "SENDING" && (
          <DialogFooter className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMode("CONFIG")}
              className="text-xs text-slate-600"
            >
              Back to Edit Message
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Close Queue
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
