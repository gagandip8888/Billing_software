"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  TrendingUp,
  Receipt,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendOfferDialog } from "@/components/customers/SendOfferDialog";

interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: string;
  status: string;
}

interface CustomerDetailClientProps {
  customer: {
    id: string;
    name: string;
    mobile: string;
    email?: string | null;
    address?: string | null;
    gstNo?: string | null;
    totalSpent: number;
    creditBalance: number;
    totalInvoices: number;
    firstVisitAt: string;
    lastVisitAt: string | null;
    invoices: InvoiceRecord[];
  };
  businessName: string;
}

export function CustomerDetailClient({
  customer,
  businessName,
}: CustomerDetailClientProps) {
  const [isOfferOpen, setIsOfferOpen] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Link href="/customers">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              {customer.name}
            </h1>
            <p className="text-xs text-slate-500 font-mono">
              {customer.mobile} {customer.address ? `· ${customer.address}` : ""}
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsOfferOpen(true)}
          className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 self-start sm:self-auto"
        >
          <MessageSquare className="h-4 w-4" />
          Send WhatsApp Offer
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Spent</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            ₹{customer.totalSpent.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Udhari / Credit Balance</span>
          <div
            className={`text-2xl font-black font-mono mt-1 ${
              customer.creditBalance > 0 ? "text-amber-600" : "text-emerald-600"
            }`}
          >
            ₹{customer.creditBalance.toFixed(2)}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Invoices</span>
          <div className="text-2xl font-black text-slate-900 font-mono mt-1">
            {customer.totalInvoices}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Last Visit</span>
          <div className="text-sm font-bold text-slate-800 mt-2 truncate">
            {customer.lastVisitAt
              ? new Date(customer.lastVisitAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Never"}
          </div>
        </div>
      </div>

      {/* Customer Invoices History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Purchase & Invoice History</h2>
            <p className="text-xs text-slate-500">All bills generated for this customer</p>
          </div>
          <span className="text-xs text-slate-400">
            {customer.invoices.length} bill(s)
          </span>
        </div>

        {customer.invoices.length === 0 ? (
          <div className="text-center py-10">
            <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Invoices Yet</p>
            <p className="text-[11px] text-slate-400">Bills created for this customer will show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">Invoice No</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Mode</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Total</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Paid</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customer.invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-slate-50/70">
                    <TableCell className="font-mono text-xs font-bold text-blue-600">
                      {inv.invoiceNo}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600">
                      {inv.paymentMode}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-semibold ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : inv.status === "UNPAID"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                      ₹{inv.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-600">
                      ₹{inv.paidAmount.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-xs font-bold ${
                        inv.balanceAmount > 0 ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      ₹{inv.balanceAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Send Offer Dialog */}
      <SendOfferDialog
        open={isOfferOpen}
        onOpenChange={setIsOfferOpen}
        customer={{ name: customer.name, mobile: customer.mobile }}
        shopName={businessName}
      />
    </div>
  );
}
