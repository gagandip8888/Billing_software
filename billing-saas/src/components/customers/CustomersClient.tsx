"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  MessageSquare,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  ExternalLink,
  Phone,
  Calendar,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SendOfferDialog } from "./SendOfferDialog";
import { BulkOfferDialog } from "./BulkOfferDialog";

export interface SerializedCustomer {
  id: string;
  name: string;
  mobile: string;
  firstVisitAt: string;
  lastVisitAt: string | null;
  totalInvoices: number;
  totalSpent: number;
  creditBalance: number;
  address?: string | null;
}

interface CustomersClientProps {
  initialCustomers: SerializedCustomer[];
  businessName: string;
}

function formatRelativeTime(dateStr?: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  return `${Math.floor(diffMonths / 12)} years ago`;
}

export function CustomersClient({
  initialCustomers,
  businessName,
}: CustomersClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "DORMANT">("ALL");

  // Offer modal state
  const [offerCustomer, setOfferCustomer] = useState<SerializedCustomer | null>(null);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isBulkOfferOpen, setIsBulkOfferOpen] = useState(false);

  // Compute stats
  const thirtyDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.getTime();
  }, []);

  const totalCustomers = initialCustomers.length;

  const activeCustomers = useMemo(() => {
    return initialCustomers.filter((c) => {
      if (!c.lastVisitAt) return false;
      return new Date(c.lastVisitAt).getTime() >= thirtyDaysAgo;
    });
  }, [initialCustomers, thirtyDaysAgo]);

  const dormantCustomers = useMemo(() => {
    return initialCustomers.filter((c) => {
      if (!c.lastVisitAt) return true;
      return new Date(c.lastVisitAt).getTime() < thirtyDaysAgo;
    });
  }, [initialCustomers, thirtyDaysAgo]);

  // Filter list
  const filteredCustomers = useMemo(() => {
    let list = initialCustomers;
    if (activeTab === "ACTIVE") list = activeCustomers;
    if (activeTab === "DORMANT") list = dormantCustomers;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return list;

    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [initialCustomers, activeTab, activeCustomers, dormantCustomers, searchQuery]);

  function handleOpenOffer(c: SerializedCustomer, e: React.MouseEvent) {
    e.stopPropagation();
    setOfferCustomer(c);
    setIsOfferOpen(true);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 1. Header (Only "Customers") */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Customers
          </h1>
          <p className="text-xs text-slate-500">
            Track customer visits, total billings, purchase habits, and send direct WhatsApp offers
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsBulkOfferOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-4 rounded-lg shadow-sm shadow-emerald-500/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Send Offer to All Customers</span>
        </Button>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setActiveTab("ALL")}
          className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            activeTab === "ALL"
              ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Customers</span>
            <div className="text-2xl font-black text-slate-900">{totalCustomers}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("ACTIVE")}
          className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            activeTab === "ACTIVE"
              ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Active (Last 30 Days)</span>
            <div className="text-2xl font-black text-emerald-600">{activeCustomers.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div
          onClick={() => setActiveTab("DORMANT")}
          className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
            activeTab === "DORMANT"
              ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500 shadow-xs"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Dormant (30+ Days)</span>
            <div className="text-2xl font-black text-amber-600">{dormantCustomers.length}</div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserX className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* 3. Customer Directory Card */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search customer name, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Showing <strong>{filteredCustomers.length}</strong> of {totalCustomers} customers
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No Customers Found</p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-700">Name</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Mobile</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">First Visit</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Last Visit</TableHead>
                    <TableHead className="text-center text-xs font-bold text-slate-700">Invoices</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700">Total Spent</TableHead>
                    <TableHead className="text-right text-xs font-bold text-slate-700">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((c) => (
                    <TableRow
                      key={c.id}
                      onClick={() => router.push(`/customers/${c.id}`)}
                      className="hover:bg-slate-50/80 cursor-pointer transition group"
                    >
                      <TableCell className="font-semibold text-xs text-slate-900 group-hover:text-blue-600">
                        {c.name}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-600">
                        {c.mobile}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {formatRelativeTime(c.firstVisitAt)}
                      </TableCell>
                      <TableCell className="text-xs text-slate-700 font-medium">
                        {formatRelativeTime(c.lastVisitAt)}
                      </TableCell>
                      <TableCell className="text-center font-mono text-xs text-slate-700 font-semibold">
                        {c.totalInvoices || 1}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs font-bold text-slate-900">
                        ₹{c.totalSpent.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleOpenOffer(c, e)}
                          className="h-8 text-[11px] font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 gap-1"
                        >
                          <MessageSquare className="h-3 w-3 text-emerald-600" />
                          Send Offer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => router.push(`/customers/${c.id}`)}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 transition cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                      <span className="font-mono text-xs text-slate-500">{c.mobile}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-slate-900 font-mono block">
                        ₹{c.totalSpent.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {c.totalInvoices || 1} bills
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>First: {formatRelativeTime(c.firstVisitAt)}</span>
                    <span className="font-medium text-slate-700">Last: {formatRelativeTime(c.lastVisitAt)}</span>
                  </div>

                  <div className="pt-1 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleOpenOffer(c, e)}
                      className="h-8 text-xs font-semibold border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1.5 w-full"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                      Send WhatsApp Offer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* WhatsApp Individual Offer Dialog */}
      <SendOfferDialog
        open={isOfferOpen}
        onOpenChange={setIsOfferOpen}
        customer={offerCustomer}
        shopName={businessName}
      />

      {/* WhatsApp Bulk Offer Dialog (Queue) */}
      <BulkOfferDialog
        open={isBulkOfferOpen}
        onOpenChange={setIsBulkOfferOpen}
        customers={initialCustomers}
        businessName={businessName}
      />
    </div>
  );
}
