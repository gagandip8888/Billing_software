"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/lib/language-context";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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
  last7DaysData,
  recentBills,
  recentExpenses,
  lowStockAlerts = [],
}: DashboardClientProps) {
  const { t } = useLanguage();
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            {t("businessDashboard", "Business Dashboard")}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("dashboardSubtitle", "Real-time daily sales, profit/loss, and expenses for")}{" "}
            <span className="font-semibold text-slate-700">{tenant.businessName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
          <Clock className="h-3.5 w-3.5 text-[#7C3AED]" />
          <span>Today: {format(new Date(), "dd MMMM yyyy")}</span>
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
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-red-900 bg-white/80 border border-red-200 px-2.5 py-0.5 rounded-md"
                  >
                    <span className="font-semibold text-slate-900">{item.name} - <strong className="text-red-700 font-mono font-bold">{item.stockQty} left</strong></span>
                    {item.productId && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1 rounded border border-slate-200">ID: {item.productId}</span>
                    )}
                  </span>
                ))}
                {lowStockAlerts.length > 3 && (
                  <span className="text-[11px] font-semibold text-red-800">
                    +{lowStockAlerts.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href="/products?filter=low_stock"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-sm transition whitespace-nowrap self-start sm:self-auto shrink-0"
          >
            <span>View Products</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* STATS CARDS: Today's Metrics + Monthly Profit */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Today's Sales with Cash vs Online Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t("todaySales", "Today's Sales")}
              </span>
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight font-mono">
              ₹{todaySale.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Breakdown: Cash vs Online vs Total */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[11px]">
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                {t("cash", "Cash")}:
              </span>
              <span className="font-bold font-mono text-slate-800">
                ₹{todayCashSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block"></span>
                {t("online", "Online")}:
              </span>
              <span className="font-bold font-mono text-slate-800">
                ₹{todayOnlineSales.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center text-purple-700 font-bold border-t border-dashed border-slate-200/80 pt-1 mt-0.5">
              <span>{t("total", "Total")}:</span>
              <span className="font-mono">
                ₹{todaySale.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Today's Expense */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("todayExpense", "Today's Expense")}
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600 tracking-tight font-mono">
            ₹{todayExpense.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-rose-600 font-medium mt-1">
            From store expenses
          </p>
        </div>

        {/* 3. Today's Profit (Green if positive, red if negative) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("todayProfit", "Today's Profit")}
            </span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                isProfitPositive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isProfitPositive ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-black tracking-tight font-mono ${
              isProfitPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {todayProfit < 0 ? "-" : ""}₹
            {Math.abs(todayProfit).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p
            className={`text-[10px] font-medium mt-1 truncate ${
              isProfitPositive ? "text-emerald-600" : "text-red-600"
            }`}
            title={`Sales (₹${todaySale}) - Cost (₹${todayCost}) - Expense (₹${todayExpense}) = Profit (₹${todayProfit})`}
          >
            Sale - Cost(₹{todayCost.toLocaleString("en-IN")}) - Exp
          </p>
        </div>

        {/* 4. Monthly Profit Card (Task 2) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("monthlyProfit", "Monthly Profit")}
            </span>
            <div
              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${
                isMonthlyProfitPositive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {isMonthlyProfitPositive ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-black tracking-tight font-mono ${
              isMonthlyProfitPositive ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {monthlyProfit < 0 ? "-" : ""}₹
            {Math.abs(monthlyProfit).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p
            className={`text-[10px] font-medium mt-1 truncate ${
              isMonthlyProfitPositive ? "text-emerald-600" : "text-red-600"
            }`}
            title={`Month Sales (₹${monthSale}) - Cost (₹${monthCost}) - Expense (₹${monthExpense}) = Profit (₹${monthlyProfit})`}
          >
            Sales - Cost(₹{monthCost.toLocaleString("en-IN")}) - Exp
          </p>
        </div>

        {/* 5. Today's Customers */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("todayCustomers", "Today's Customers")}
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 tracking-tight font-mono">
            {todayCustomers}
          </div>
          <p className="text-[10px] text-blue-600 font-medium mt-1">Unique buyers today</p>
        </div>

        {/* 6. Today's Udhari */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-sm transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {t("todayUdhari", "Today's Udhari")}
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
          <div
            className={`mt-3 text-2xl font-black tracking-tight font-mono ${
              todayUdhari > 0 ? "text-amber-600" : "text-slate-900"
            }`}
          >
            ₹{todayUdhari.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[10px] text-amber-600 font-medium mt-1">
            Credit issued today
          </p>
        </div>
      </div>

      {/* TASK 2: DASHBOARD CHARTS (Mini) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mini Chart 1: Last 7 Days Sales (Bar Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-[#7C3AED]" />
                <span>{t("last7DaysSales", "Last 7 Days Sales")}</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                7-Day Total: ₹
                {last7DaysData
                  .reduce((s, d) => s + d.sales, 0)
                  .toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              Daily Sales (₹)
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            {!isMounted ? (
              <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={last7DaysData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
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
                    cursor={{ fill: "rgba(124, 58, 237, 0.05)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-semibold text-slate-300">
                              {data.label} ({data.dayName})
                            </p>
                            <p className="font-bold text-emerald-400 text-sm">
                              Sales: ₹{data.sales.toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="sales"
                    fill="#7C3AED"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Mini Chart 2: Last 7 Days Profit (Line Chart) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{t("last7DaysProfit", "Last 7 Days Profit")}</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                7-Day Net: ₹
                {last7DaysData
                  .reduce((s, d) => s + d.profit, 0)
                  .toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
              Net Profit (₹)
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            {!isMounted ? (
              <div className="h-full w-full bg-slate-50 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
                Loading chart...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={last7DaysData}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
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
                        return (
                          <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-xs shadow-lg space-y-1">
                            <p className="font-semibold text-slate-300">
                              {data.label} ({data.dayName})
                            </p>
                            <p
                              className={`font-bold text-sm ${
                                isPos ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              Profit: ₹{data.profit.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Sales: ₹{data.sales.toLocaleString("en-IN")} | Cost: ₹
                              {data.cost.toLocaleString("en-IN")} | Exp: ₹
                              {data.expense.toLocaleString("en-IN")}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ r: 3.5, fill: "#10B981" }}
                    activeDot={{ r: 6, fill: "#10B981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
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
                href="/billing"
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
                    <div className="flex items-center gap-2">
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
                    <p className="text-[11px] text-slate-600 truncate mt-1">
                      {bill.customerName}
                    </p>
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

      {/* Low Stock Alerts (Bonus inventory safety section if items are low) */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span>Low Stock Alerts ({lowStockAlerts.length} items need replenishment)</span>
            </div>
            <Link
              href="/products"
              prefetch={true}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 flex items-center gap-1"
            >
              <span>Manage stock</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockAlerts.slice(0, 8).map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-amber-200 text-xs text-slate-700 shadow-2xs"
              >
                <span className="font-medium truncate max-w-[150px]">{item.name}</span>
                <span className="font-mono font-bold text-amber-700">{item.stockQty} left</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardClient;
