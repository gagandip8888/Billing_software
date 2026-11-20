"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Printer,
  ArrowRight,
  ShieldAlert,
  Clock,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trophy,
  Package,
  BarChart3,
  Sparkles,
  RefreshCw,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language-context";
import {
  BusinessStatement,
  StatementEntry,
} from "@/components/dashboard/BusinessStatement";
import {
  AddStockModal,
  LowStockProductItem,
} from "@/components/products/AddStockModal";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export interface DashboardClientProps {
  tenant: {
    id: string;
    businessName: string;
    shopType: string;
    ownerName?: string;
    mobile?: string;
  };
  todaySale: number;
  todayCashSales: number;
  todayOnlineSales: number;
  todayExpense: number;
  todayProfit: number;
  todayCost: number;
  monthlyProfit?: number;
  monthSale?: number;
  monthCost?: number;
  monthExpense?: number;
  todayCustomers: number;
  todayUdhari: number;
  totalReceivables?: number;
  receivablesCount?: number;
  totalPayables?: number;
  payablesCount?: number;
  topSellingProducts?: Array<{
    rank: number;
    name: string;
    productId: string;
    totalQty: number;
    totalRevenue: number;
  }>;
  totalProductsCount?: number;
  employeeSales?: Array<{
    name: string;
    employeeId?: string;
    role: string;
    billCount: number;
    totalSales: number;
  }>;
  last7DaysData: Array<{
    date: string;
    label: string;
    dayName: string;
    sales: number;
    profit: number;
    expense: number;
    cost: number;
  }>;
  recentBills: Array<{
    id: string;
    invoiceNo: string;
    invoiceDate: string;
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    paymentMode: string;
    customerName: string;
    createdByName?: string | null;
    createdByRole?: string | null;
    createdByEmployeeId?: string | null;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    amount: number;
    date: string;
    createdAt: string;
  }>;
  lowStockAlerts?: Array<{
    id: string;
    productId?: string | null;
    name: string;
    stockQty: number;
    lowStockAlert: number;
  }>;
  statementEntries?: StatementEntry[];
}

export function DashboardClient({
  tenant,
  todaySale,
  todayCashSales,
  todayOnlineSales,
  todayExpense,
  todayProfit,
  todayCost,
  monthlyProfit = 0,
  monthSale = 0,
  monthCost = 0,
  monthExpense = 0,
  todayCustomers,
  todayUdhari,
  totalReceivables = 0,
  receivablesCount = 0,
  totalPayables = 0,
  payablesCount = 0,
  topSellingProducts = [],
  totalProductsCount = 0,
  employeeSales = [],
  last7DaysData,
  recentBills,
  recentExpenses,
  lowStockAlerts: initialLowStockAlerts = [],
  statementEntries = [],
}: DashboardClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [lowStockAlerts, setLowStockAlerts] = useState(initialLowStockAlerts);
  const [selectedRestockProduct, setSelectedRestockProduct] = useState<LowStockProductItem | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [chartView, setChartView] = useState<"BOTH" | "SALES" | "PROFIT">("BOTH");
  const [isLiveRefreshing, setIsLiveRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    setLowStockAlerts(initialLowStockAlerts);
  }, [initialLowStockAlerts]);

  // Real-time synchronization across cashier tabs, background polling, and tab focus
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel("billingsaas_live_updates");
      channel.onmessage = () => {
        setIsLiveRefreshing(true);
        router.refresh();
        setLastSyncTime(new Date());
        setTimeout(() => setIsLiveRefreshing(false), 600);
      };
    } catch {}

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "billingsaas:last_bill_time") {
        setIsLiveRefreshing(true);
        router.refresh();
        setLastSyncTime(new Date());
        setTimeout(() => setIsLiveRefreshing(false), 600);
      }
    };
    window.addEventListener("storage", handleStorage);

    const handleCustomEvent = () => {
      setIsLiveRefreshing(true);
      router.refresh();
      setLastSyncTime(new Date());
      setTimeout(() => setIsLiveRefreshing(false), 600);
    };
    window.addEventListener("billingsaas:bill-saved", handleCustomEvent);

    // Auto-poll every 5 seconds so owner dashboard is always fresh even across different computers
    const interval = setInterval(() => {
      router.refresh();
      setLastSyncTime(new Date());
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
        setLastSyncTime(new Date());
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (channel) channel.close();
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("billingsaas:bill-saved", handleCustomEvent);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [router]);

  function handleManualRefresh() {
    setIsLiveRefreshing(true);
    router.refresh();
    setLastSyncTime(new Date());
    setTimeout(() => setIsLiveRefreshing(false), 600);
  }

  // Prevent hydration layout shift with recharts ResponsiveContainer
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isProfitPositive = todayProfit >= 0;
  const isMonthlyProfitPositive = monthlyProfit >= 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              {tenant.businessName || t("businessDashboard", "Business Dashboard")}
            </h1>
            <Badge variant="outline" className="text-[10px] font-bold bg-purple-50 text-purple-700 border-purple-200 capitalize">
              {tenant.shopType ? tenant.shopType.replace(/_/g, " ").toLowerCase() : "Store"}
            </Badge>

            {/* Real-time Live Sync Indicator */}
            <div
              title={`Live sync active with all cashiers & devices. Last checked: ${format(
                lastSyncTime,
                "hh:mm:ss a"
              )}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 shadow-2xs select-none"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="tracking-wide">LIVE</span>
              <button
                type="button"
                onClick={handleManualRefresh}
                className="ml-0.5 text-emerald-600 hover:text-emerald-900 transition"
              >
                <RefreshCw
                  className={`h-2.5 w-2.5 ${isLiveRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("dashboardSubtitle", "Real-time daily sales, profit/loss, and live employee performance")}
          </p>
        </div>

        {/* Quick Actions & Live Date */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/billing/new" prefetch={true}>
            <Button size="sm" className="bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs h-9 px-3.5 shadow-sm shadow-purple-500/20 gap-1.5">
              <Plus className="h-3.5 w-3.5" /> + New Bill
            </Button>
          </Link>
          <Link href="/expenses" prefetch={true}>
            <Button size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50 font-semibold text-xs h-9 px-3 gap-1.5">
              <Receipt className="h-3.5 w-3.5" /> Record Expense
            </Button>
          </Link>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-2 rounded-lg shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-[#7C3AED]" />
            <span>{format(new Date(), "dd MMMM yyyy")}</span>
          </div>
        </div>
      </div>

      {/* Prominent Red/Amber Low Stock Alert Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-red-50/90 border-2 border-red-300 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-950 flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Low Stock Alert
                </span>
                <span>
                  {lowStockAlerts.length} {lowStockAlerts.length === 1 ? "product is" : "products are"} running low on stock!
                </span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {lowStockAlerts.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedRestockProduct(item);
                      setIsRestockModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-900 bg-white/90 hover:bg-white border border-red-200 px-2.5 py-1 rounded-md shadow-2xs transition group text-left"
                    title="Click to replenish stock"
                  >
                    <span className="font-semibold text-slate-900">{item.name} - <strong className="text-red-700 font-mono font-bold">{item.stockQty} left</strong></span>
                    {item.productId && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">ID: {item.productId}</span>
                    )}
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1 rounded flex items-center gap-0.5">
                      <Plus className="h-2.5 w-2.5" /> Restock
                    </span>
                  </button>
                ))}
                {lowStockAlerts.length > 3 && (
                  <span className="text-[11px] font-semibold text-red-800">
                    +{lowStockAlerts.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                if (lowStockAlerts[0]) {
                  setSelectedRestockProduct(lowStockAlerts[0]);
                  setIsRestockModalOpen(true);
                }
              }}
              className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm transition whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Restock Now</span>
            </button>
            <Link
              href="/products?filter=low_stock"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* PRIMARY VYAPAR / TALLY STYLE METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Today's Sales */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t("todaySales", "Today's Sales")}
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
                ₹{todaySale.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-purple-50 text-[#7C3AED] border border-purple-100 flex items-center justify-center font-bold shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* Cash vs Online Split */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="text-[11px] font-medium">Cash:</span>
              <strong className="font-mono text-slate-800 font-bold">
                ₹{todayCashSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0"></span>
              <span className="text-[11px] font-medium">Online:</span>
              <strong className="font-mono text-slate-800 font-bold">
                ₹{todayOnlineSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </strong>
            </div>
          </div>
        </div>

        {/* CARD 2: Month's Profit */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {t("monthlyProfit", "Month's Profit")}
                </span>
                {monthSale > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      isMonthlyProfitPositive
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : "bg-rose-100 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {isMonthlyProfitPositive ? "+" : ""}
                    {((monthlyProfit / (monthSale || 1)) * 100).toFixed(1)}% margin
                  </span>
                )}
              </div>
              <div
                className={`mt-2 text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                  isMonthlyProfitPositive ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {monthlyProfit < 0 ? "-" : "+"}₹
                {Math.abs(monthlyProfit).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div
              className={`h-11 w-11 rounded-xl flex items-center justify-center font-bold shadow-2xs shrink-0 group-hover:scale-105 transition-transform ${
                isMonthlyProfitPositive
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}
            >
              {isMonthlyProfitPositive ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 truncate">
            <span>Sales: ₹{monthSale.toLocaleString("en-IN")}</span>
            <span className="text-slate-300">•</span>
            <span>Cost: ₹{monthCost.toLocaleString("en-IN")}</span>
            <span className="text-slate-300">•</span>
            <span>Exp: ₹{monthExpense.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {/* CARD 3: Total Receivables (Udhari) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Receivables (Udhari)
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
                ₹{totalReceivables.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-bold shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              {receivablesCount > 0
                ? `${receivablesCount} ${receivablesCount === 1 ? "customer" : "customers"} with dues`
                : "All accounts clear"}
            </span>
            <Link
              href="/udhari"
              prefetch={true}
              className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
            >
              <span>View Khata</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* CARD 4: Total Payables */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Total Payables
              </span>
              <div className="mt-2 text-2xl sm:text-3xl font-black text-rose-600 tracking-tight font-mono">
                ₹{totalPayables.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-bold shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-[11px] text-slate-500">
              {payablesCount > 0
                ? `${payablesCount} open return credit notes`
                : "No pending store liabilities"}
            </span>
            <Link
              href="/credit-notes"
              prefetch={true}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 hover:underline"
            >
              <span>Credit Notes</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* SECONDARY QUICK METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Expense</span>
            <p className="text-lg font-black text-rose-600 font-mono mt-0.5">
              ₹{todayExpense.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Receipt className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Net Profit</span>
            <p className={`text-lg font-black font-mono mt-0.5 ${todayProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {todayProfit < 0 ? "-" : ""}₹{Math.abs(todayProfit).toLocaleString("en-IN")}
            </p>
          </div>
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${todayProfit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {todayProfit >= 0 ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Today's Footfall</span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {todayCustomers} buyers
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="h-4 w-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 flex items-center justify-between shadow-2xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Products</span>
            <p className="text-lg font-black text-slate-900 font-mono mt-0.5">
              {totalProductsCount} in catalog
            </p>
          </div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Package className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* MAIN ANALYTICS SECTION: 7-DAY TREND CHART + TOP 5 BEST SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Last 7 Days Sales vs Profit Trend */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#7C3AED]" />
                <span>Sales vs Profit Trend (Last 7 Days)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare daily top-line sales against net store profitability
              </p>
            </div>

            {/* Toggle Filter Buttons */}
            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartView("BOTH")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  chartView === "BOTH"
                    ? "bg-white text-purple-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setChartView("SALES")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  chartView === "SALES"
                    ? "bg-white text-purple-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sales
              </button>
              <button
                type="button"
                onClick={() => setChartView("PROFIT")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  chartView === "PROFIT"
                    ? "bg-white text-emerald-700 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Profit
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-64 sm:h-72 w-full pt-2">
            {!isMounted ? (
              <div className="h-full w-full bg-slate-50 rounded-xl animate-pulse flex items-center justify-center text-xs text-slate-400">
                Loading analytics chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={last7DaysData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) =>
                      `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const isPos = data.profit >= 0;
                        const margin =
                          data.sales > 0 ? ((data.profit / data.sales) * 100).toFixed(1) : "0";
                        return (
                          <div className="bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-xl text-xs shadow-xl space-y-1.5 border border-slate-800">
                            <p className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between">
                              <span>{data.label} ({data.dayName})</span>
                              <span className={isPos ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                                {isPos ? `+${margin}% margin` : "Loss"}
                              </span>
                            </p>
                            <div className="space-y-0.5 font-mono">
                              <p className="text-purple-300 font-semibold flex justify-between gap-4">
                                <span>Sales:</span> <strong>₹{data.sales.toLocaleString("en-IN")}</strong>
                              </p>
                              <p className="text-slate-400 flex justify-between gap-4 text-[11px]">
                                <span>Product Cost:</span> <span>₹{data.cost.toLocaleString("en-IN")}</span>
                              </p>
                              <p className="text-slate-400 flex justify-between gap-4 text-[11px]">
                                <span>Expenses:</span> <span>₹{data.expense.toLocaleString("en-IN")}</span>
                              </p>
                              <p className={`pt-1 border-t border-slate-800 font-bold flex justify-between gap-4 ${isPos ? "text-emerald-400" : "text-rose-400"}`}>
                                <span>Net Profit:</span> <span>{data.profit < 0 ? "-" : "+"}₹{Math.abs(data.profit).toLocaleString("en-IN")}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {(chartView === "BOTH" || chartView === "SALES") && (
                    <Bar
                      dataKey="sales"
                      name="Sales"
                      fill="url(#colorSales)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={38}
                    />
                  )}
                  {(chartView === "BOTH" || chartView === "PROFIT") && (
                    <Line
                      type="monotone"
                      dataKey="profit"
                      name="Net Profit"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#ffffff" }}
                      activeDot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#ffffff" }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Chart Summary Footnotes */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 font-medium block">7-Day Sales</span>
              <strong className="text-slate-900 font-mono text-sm">
                ₹{last7DaysData.reduce((s, d) => s + d.sales, 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 font-medium block">7-Day Profit</span>
              <strong className="text-emerald-600 font-mono text-sm">
                ₹{last7DaysData.reduce((s, d) => s + d.profit, 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 font-medium block">Avg Daily Sale</span>
              <strong className="text-slate-900 font-mono text-sm">
                ₹{Math.round(last7DaysData.reduce((s, d) => s + d.sales, 0) / 7).toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="p-2 rounded-lg bg-slate-50">
              <span className="text-[10px] text-slate-400 font-medium block">Avg Net Margin</span>
              <strong className="text-purple-700 font-mono text-sm">
                {(() => {
                  const totS = last7DaysData.reduce((s, d) => s + d.sales, 0);
                  const totP = last7DaysData.reduce((s, d) => s + d.profit, 0);
                  return totS > 0 ? `${((totP / totS) * 100).toFixed(1)}%` : "0%";
                })()}
              </strong>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Top 5 Best Selling Products */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span>Top 5 Best Selling Products</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Highest volume items sold in store
                </p>
              </div>
              <Link
                href="/products"
                prefetch={true}
                className="text-xs font-semibold text-[#7C3AED] hover:text-purple-700 flex items-center gap-1 transition"
              >
                <span>Inventory</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* List of Top 5 Items */}
            <div className="pt-2 space-y-3">
              {topSellingProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                  <Package className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="font-semibold text-slate-700">No Sales Data Yet</p>
                  <p className="text-[11px] text-slate-400">
                    As you generate bills, your highest selling products will appear here.
                  </p>
                  <Link href="/billing/new" prefetch={true} className="inline-block pt-1">
                    <Button size="sm" className="bg-[#7C3AED] text-white text-xs h-8">
                      + Create First Bill
                    </Button>
                  </Link>
                </div>
              ) : (
                topSellingProducts.map((p) => {
                  const maxQty = topSellingProducts[0]?.totalQty || 1;
                  const pct = Math.min(100, Math.round((p.totalQty / maxQty) * 100));

                  return (
                    <div
                      key={`${p.rank}-${p.name}`}
                      className="p-3 rounded-xl border border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition group space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              p.rank === 1
                                ? "bg-amber-500 text-white shadow-xs ring-2 ring-amber-200"
                                : p.rank === 2
                                ? "bg-slate-400 text-white"
                                : p.rank === 3
                                ? "bg-amber-700 text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            #{p.rank}
                          </span>
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-900 truncate group-hover:text-purple-900 transition">
                              {p.name}
                            </p>
                            {p.productId && p.productId !== "—" && (
                              <span className="font-mono text-[10px] text-slate-400">
                                ID: {p.productId}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-xs text-slate-900">
                            ₹{p.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                          </p>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-mono">
                            {p.totalQty} {p.totalQty === 1 ? "unit" : "units"}
                          </span>
                        </div>
                      </div>

                      {/* Visual share bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.rank === 1 ? "bg-amber-500" : "bg-[#7C3AED]"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE EMPLOYEE SALES & RECENT ACTIVITY */}
      <div className="space-y-6">
        {/* LIVE EMPLOYEE / CASHIER SALES SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-[#7C3AED]" />
                  <span>Live Employee & Cashier Sales</span>
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE FEED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Real-time breakdown of bills and revenue generated by store staff today
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/settings?tab=staff"
                prefetch={true}
                className="text-xs font-semibold text-[#7C3AED] hover:text-purple-700 flex items-center gap-1 transition"
              >
                <span>Manage Staff</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {employeeSales.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2">
              <Users className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-700">No Employee Activity Recorded Today</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Add staff members in Settings with their Employee ID. When they log in and bill customers, their sales appear here instantly.
              </p>
              <Link href="/settings?tab=staff" prefetch={true} className="inline-block pt-1">
                <Button size="sm" variant="outline" className="text-xs h-8 text-[#7C3AED] border-purple-200">
                  + Add Staff Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employeeSales.map((staff, idx) => {
                const maxSales = Math.max(...employeeSales.map((s) => s.totalSales), 1);
                const pct = Math.min(100, Math.round((staff.totalSales / maxSales) * 100));
                const isTop = idx === 0 && staff.totalSales > 0;

                return (
                  <div
                    key={`${staff.name}-${staff.employeeId || idx}`}
                    className={`p-3.5 rounded-xl border transition group relative overflow-hidden ${
                      isTop
                        ? "bg-purple-50/30 border-purple-200 hover:border-purple-300 shadow-2xs"
                        : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                            staff.role === "CASHIER"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-indigo-100 text-indigo-700"
                          }`}
                        >
                          {staff.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                            <span>{staff.name}</span>
                            {isTop && (
                              <span className="text-[9px] font-black bg-amber-500 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                                Top Seller
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {staff.employeeId ? `ID: ${staff.employeeId}` : staff.role === "CASHIER" ? "Cashier" : "Store Owner"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-mono font-bold text-xs text-slate-900">
                          ₹{staff.totalSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-mono">
                          {staff.billCount} {staff.billCount === 1 ? "bill" : "bills"}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar of revenue share */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isTop ? "bg-[#7C3AED]" : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* TASK 3: RECENT ACTIVITY (SIDE-BY-SIDE LISTS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Recent Bills (Last 5) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Printer className="h-4 w-4 text-[#7C3AED]" />
                  <span>{t("recentBills", "Recent Bills (Last 5)")}</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Click any bill to open bill print view
                </p>
              </div>
              <Link
                href="/invoices"
                prefetch={true}
                className="text-xs font-semibold text-[#7C3AED] hover:text-purple-700 flex items-center gap-1 transition"
              >
                <span>{t("viewAll", "View all")}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {recentBills.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <p>No bills created yet.</p>
                <Link
                  href="/billing/new"
                  className="mt-2 inline-block text-xs font-semibold text-[#7C3AED] hover:underline"
                >
                  + Create New Bill
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentBills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={`/invoices/${bill.id}`}
                    className="flex items-center justify-between py-3 px-2.5 rounded-lg hover:bg-purple-50/50 transition group"
                    title="Click to view & print bill"
                  >
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 text-xs group-hover:text-[#7C3AED] transition">
                          {bill.invoiceNo}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] font-bold px-1.5 py-0 ${
                            bill.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : bill.status === "UNPAID"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {bill.status}
                        </Badge>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          {bill.paymentMode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <p className="text-[11px] text-slate-600 truncate">
                          {bill.customerName}
                        </p>
                        {bill.createdByName && (
                          <span className="text-[9px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded shrink-0">
                            By: {bill.createdByName}
                            {bill.createdByEmployeeId ? ` (${bill.createdByEmployeeId})` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2.5">
                      <div>
                        <p className="text-xs font-bold text-slate-900 font-mono">
                          ₹{bill.totalAmount.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {format(new Date(bill.invoiceDate), "dd MMM, hh:mm a")}
                        </p>
                      </div>
                      <Printer className="h-4 w-4 text-slate-400 group-hover:text-[#7C3AED] transition" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        {/* 2. Recent Expenses (Last 5) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Receipt className="h-4 w-4 text-rose-500" />
                <span>{t("recentExpenses", "Recent Expenses (Last 5)")}</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Click any expense to manage in /expenses
              </p>
            </div>
            <Link
              href="/expenses"
              prefetch={true}
              className="text-xs font-semibold text-[#7C3AED] hover:text-purple-700 flex items-center gap-1 transition"
            >
              <span>{t("viewAll", "View all")}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p>No expenses recorded yet.</p>
              <Link
                href="/expenses"
                className="mt-2 inline-block text-xs font-semibold text-[#7C3AED] hover:underline"
              >
                + Record Store Expense
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentExpenses.map((exp) => (
                <Link
                  key={exp.id}
                  href="/expenses"
                  className="flex items-center justify-between py-3 px-2.5 rounded-lg hover:bg-rose-50/40 transition group"
                  title="Click to view in /expenses"
                >
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-semibold text-slate-900 text-xs truncate group-hover:text-rose-600 transition">
                      {exp.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {format(new Date(exp.date), "dd MMMM yyyy")}
                    </p>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-600 font-mono">
                      -₹{exp.amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 transition ml-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* 3. Bank-Style Account & Cashflow Statement (Task 1) */}
      <BusinessStatement
        entries={statementEntries}
        businessName={tenant.businessName}
      />

      {/* Low Stock Alerts (Bonus inventory safety section if items are low) */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Low Stock Alerts ({lowStockAlerts.length} items need replenishment)</span>
            </div>
            <Link
              href="/products?filter=low_stock"
              prefetch={true}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>Manage stock</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockAlerts.slice(0, 8).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSelectedRestockProduct(item);
                  setIsRestockModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-amber-100/80 border border-amber-200 text-xs text-slate-700 shadow-2xs transition cursor-pointer text-left"
                title="Click to restock this product"
              >
                <span className="font-medium truncate max-w-[150px]">{item.name}</span>
                <span className="font-mono font-bold text-amber-700">{item.stockQty} left</span>
                <Plus className="h-3 w-3 text-amber-700 ml-0.5" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Stock Modal for Low Stock replenishment */}
      <AddStockModal
        open={isRestockModalOpen}
        onOpenChange={setIsRestockModalOpen}
        product={selectedRestockProduct}
        onSuccess={(updated) => {
          // Immediately update state and filter out products whose stock now exceeds lowStockAlert
          setLowStockAlerts((prev) =>
            prev
              .map((p) => (p.id === updated.id ? { ...p, stockQty: updated.stockQty } : p))
              .filter((p) => Number(p.stockQty) <= Number(p.lowStockAlert))
          );
        }}
      />
    </div>
  );
}

export default DashboardClient;
