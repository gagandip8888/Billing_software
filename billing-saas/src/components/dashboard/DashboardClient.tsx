"use client";

import React from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Users,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Package,
  Calendar,
  IndianRupee,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  Sparkles,
  BarChart3,
  CreditCard,
  Banknote,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface DashboardClientProps {
  tenant: {
    id: string;
    businessName: string;
    shopType: string;
    ownerName?: string;
    mobile?: string;
  };
  subscription?: {
    plan: string;
    status: string;
    billsThisMonth: number;
    billLimit: number;
    remainingBills: number | null;
    percentageUsed: number;
  };
  todaySales: number;
  todayInvoiceCount: number;
  yesterdaySales: number;
  salesChange: string;
  monthRevenue: number;
  pendingDues: number;
  paidAmount: number;
  totalInvoices: number;
  activeCustomers: number;
  lowStockCount: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    stockQty: any;
    lowStockAlert: any;
  }>;
  recentInvoices: Array<{
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    totalAmount: string;
    status: string;
    paymentMode: string;
    customerName: string;
  }>;
  topProducts: Array<{
    name: string;
    qty: string;
    revenue: string;
  }>;
}

function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(val);
}

function getPaymentBadge(mode: string) {
  switch (mode) {
    case "UPI":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <QrCode className="h-3 w-3" /> UPI
        </span>
      );
    case "CASH":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Banknote className="h-3 w-3" /> Cash
        </span>
      );
    case "CARD":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <CreditCard className="h-3 w-3" /> Card
        </span>
      );
    case "CREDIT":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Khata / Udhar
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
          {mode.replace(/_/g, " ")}
        </span>
      );
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Paid
        </span>
      );
    case "PARTIAL":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600" /> Partial
        </span>
      );
    case "UNPAID":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-red-600" /> Unpaid
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
}

export function DashboardClient({
  tenant,
  subscription,
  todaySales,
  todayInvoiceCount,
  yesterdaySales,
  salesChange,
  monthRevenue,
  pendingDues,
  paidAmount,
  totalInvoices,
  activeCustomers,
  lowStockCount,
  lowStockItems,
  recentInvoices,
  topProducts,
}: DashboardClientProps) {
  const isChangePositive = parseFloat(salesChange) >= 0;
  const todayFormatted = format(new Date(), "EEEE, dd MMMM yyyy");

  return (
    <div className="space-y-6">
      {/* 1. WELCOME & TOP ACTIONS BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {tenant.businessName}
            </h1>
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 capitalize">
              {tenant.shopType.toLowerCase().replace(/_/g, " ")}
            </span>
            {subscription && (
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                subscription.plan === "ENTERPRISE"
                  ? "bg-amber-100 text-amber-800"
                  : subscription.plan === "PRO"
                  ? "bg-purple-100 text-purple-800"
                  : subscription.plan === "BASIC"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-700"
              }`}>
                {subscription.plan} PLAN
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{todayFormatted}</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Supabase Sync
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {subscription && (
            <Link
              href="/subscription"
              className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <CreditCard className="h-3.5 w-3.5 text-blue-600" />
              <span>
                Bills: {subscription.billsThisMonth} / {subscription.billLimit === -1 ? "∞" : subscription.billLimit}
              </span>
              <span className="text-blue-600 ml-1">Upgrade &rarr;</span>
            </Link>
          )}
          <Link href="/invoices">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-slate-500" /> Invoices
            </Button>
          </Link>
          <Link href="/billing/new">
            <Button
              size="sm"
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5"
            >
              <PlusCircle className="h-4 w-4" /> + Create New Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. REAL-TIME KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Today&apos;s Sales
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              ₹
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{formatINR(todaySales)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span
              className={`flex items-center font-bold ${
                isChangePositive ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              {isChangePositive ? (
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 mr-1" />
              )}
              {isChangePositive ? `+${salesChange}%` : `${salesChange}%`} vs yest.
            </span>
            <span className="text-slate-400 font-medium">
              {todayInvoiceCount} {todayInvoiceCount === 1 ? "bill" : "bills"}
            </span>
          </div>
        </div>

        {/* Metric 2: Month's Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              This Month&apos;s Revenue
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            ₹{formatINR(monthRevenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Collected:</span>
            <span className="font-bold text-emerald-600">₹{formatINR(paidAmount)}</span>
          </div>
        </div>

        {/* Metric 3: Pending Dues (Khata) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending Dues (Khata)
            </span>
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold ${
                pendingDues > 0 ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl sm:text-3xl font-black tracking-tight ${
              pendingDues > 0 ? "text-red-600" : "text-slate-900"
            }`}
          >
            ₹{formatINR(pendingDues)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {pendingDues > 0 ? (
              <span className="text-red-600 font-semibold flex items-center gap-1">
                Outstanding customer balances
              </span>
            ) : (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> All dues cleared
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Invoices & Customers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Invoices
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {totalInvoices}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Active Customers:</span>
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-blue-600" />
              {activeCustomers}
            </span>
          </div>
        </div>
      </div>

      {/* 3. LOW STOCK WARNING BANNER (Only if low stock products exist) */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Low Stock Alert ({lowStockCount} {lowStockCount === 1 ? "item" : "items"})
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                The following products are at or below their reorder threshold:{" "}
                <span className="font-semibold">
                  {lowStockItems.slice(0, 3).map((p) => p.name).join(", ")}
                  {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} more` : ""}
                </span>
              </p>
            </div>
          </div>
          <Link href="/products">
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 bg-white hover:bg-amber-100 text-amber-900 text-xs font-semibold whitespace-nowrap"
            >
              Manage Inventory
            </Button>
          </Link>
        </div>
      )}

      {/* 4. MAIN CONTENT GRID: RECENT INVOICES & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Recent Invoices */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Invoices</h2>
                <p className="text-xs text-slate-500">Live transactions recorded in your shop</p>
              </div>
              <Link
                href="/invoices"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
              >
                View All ({totalInvoices}) <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentInvoices.length === 0 ? (
              <div className="py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Invoices Yet</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  Start generating your first customer bills with automatic GST and print receipts.
                </p>
                <Link href="/billing/new">
                  <Button size="sm" className="bg-blue-600 text-white text-xs font-semibold">
                    <PlusCircle className="h-3.5 w-3.5 mr-1" /> Create First Bill
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 pr-3">Invoice No</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 pl-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 pr-3 font-bold text-blue-600">
                          <Link href={`/invoices/${inv.id}`} className="hover:underline">
                            {inv.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium truncate max-w-[130px]">
                          {inv.customerName}
                        </td>
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {format(new Date(inv.invoiceDate), "dd MMM, hh:mm a")}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getPaymentBadge(inv.paymentMode)}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {getStatusBadge(inv.status)}
                        </td>
                        <td className="py-3 pl-3 text-right font-bold text-slate-900">
                          ₹{formatINR(Number(inv.totalAmount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span>Showing recent {recentInvoices.length} transactions</span>
            <Link href="/billing/new" className="text-blue-600 font-semibold hover:underline flex items-center gap-1">
              + Fast Counter Bill
            </Link>
          </div>
        </div>

        {/* Right Column (1 col): Top Performing Products */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Top Products</h2>
                <p className="text-xs text-slate-500">Highest sales in last 30 days</p>
              </div>
              <Package className="h-4 w-4 text-slate-400" />
            </div>

            {topProducts.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No Sales Data Yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Product performance rankings will show here as you generate bills.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {topProducts.map((p, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate" title={p.name}>
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {Number(p.qty).toLocaleString("en-IN")} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-slate-900">
                        ₹{formatINR(Number(p.revenue))}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-semibold">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link href="/products">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                View Full Product Catalog
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 5. QUICK SHOP SHORTCUTS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Link
          href="/billing/new"
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <PlusCircle className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">New Bill</p>
          <p className="text-[11px] text-slate-500">Create GST invoice</p>
        </Link>

        <Link
          href="/products"
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Package className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">Products</p>
          <p className="text-[11px] text-slate-500">Stock & price list</p>
        </Link>

        <Link
          href="/customers"
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">Customers</p>
          <p className="text-[11px] text-slate-500">Khata & contacts</p>
        </Link>

        <Link
          href="/reports"
          className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition group"
        >
          <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <BarChart3 className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-slate-900">Reports</p>
          <p className="text-[11px] text-slate-500">GST & sales analytics</p>
        </Link>
      </div>
    </div>
  );
}
