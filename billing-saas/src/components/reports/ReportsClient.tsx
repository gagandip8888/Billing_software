"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Receipt,
  Download,
  IndianRupee,
  FileSpreadsheet,
  Package,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  Building,
  BarChart3,
  Layers,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  HelpCircle,
  FileText,
  AlertCircle,
  Info,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { DateRangeSelector } from "@/components/reports/DateRangeSelector";
import { DateRangePreset, PRESET_LABELS } from "@/lib/date-range";
import { ReportsData } from "@/lib/reports";
import { exportToCsv } from "@/lib/csv-export";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ReportsClientProps {
  initialData: ReportsData;
  initialPreset: DateRangePreset;
}

const PIE_COLORS = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#64748b", "#ec4899"];

export function ReportsClient({
  initialData,
  initialPreset,
}: ReportsClientProps) {
  const [data, setData] = useState<ReportsData>(initialData);
  const [preset, setPreset] = useState<DateRangePreset>(initialPreset);
  const [customFrom, setCustomFrom] = useState<string | undefined>(
    initialData.dateRange.from
  );
  const [customTo, setCustomTo] = useState<string | undefined>(
    initialData.dateRange.to
  );
  const [activeTab, setActiveTab] = useState<
    "sales" | "gst" | "products" | "customers" | "profit"
  >("sales");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const formatINR = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "₹0";
    return (
      "₹" +
      Number(val).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })
    );
  };

  const handleRangeChange = async (
    newPreset: DateRangePreset,
    from?: string,
    to?: string
  ) => {
    setPreset(newPreset);
    setCustomFrom(from);
    setCustomTo(to);
    setIsLoading(true);

    try {
      const params = new URLSearchParams();
      params.set("preset", newPreset);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reports data");
      const json = await res.json();
      if (json.reports) {
        setData(json.reports);
        toast.success(`Reports updated for ${PRESET_LABELS[newPreset]}`);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Export Handlers
  const handleExport = () => {
    const fromLabel = data.dateRange.from.split("T")[0];
    const toLabel = data.dateRange.to.split("T")[0];

    switch (activeTab) {
      case "sales": {
        const headers = [
          "Invoice No",
          "Date",
          "Customer Name",
          "Mobile",
          "Payment Mode",
          "Status",
          "Total Amount (INR)",
          "Paid Amount (INR)",
          "Balance (INR)",
        ];
        const rows = data.sales.invoicesList.map((inv) => [
          inv.invoiceNo,
          inv.invoiceDate.split("T")[0],
          inv.customerName,
          inv.customerMobile,
          inv.paymentMode,
          inv.status,
          inv.totalAmount,
          inv.paidAmount,
          inv.balanceAmount,
        ]);
        exportToCsv(`Sales_Report_${fromLabel}_${toLabel}`, headers, rows);
        toast.success("Sales register exported to CSV!");
        break;
      }
      case "gst": {
        const headers = [
          "Invoice No",
          "Invoice Date",
          "Invoice Type",
          "Customer Name",
          "Customer GSTIN",
          "Taxable Value (INR)",
          "Total Tax (INR)",
          "CGST (INR)",
          "SGST (INR)",
          "Invoice Total (INR)",
        ];
        const rows = data.gst.gstr1Register.map((g) => [
          g.invoiceNo,
          g.invoiceDate.split("T")[0],
          g.invoiceType,
          g.customerName,
          g.customerGstNo || "N/A",
          g.taxableValue,
          g.taxAmount,
          g.cgst,
          g.sgst,
          g.totalAmount,
        ]);
        exportToCsv(`GSTR1_Register_${fromLabel}_${toLabel}`, headers, rows);
        toast.success("GSTR-1 report exported to CSV!");
        break;
      }
      case "products": {
        const headers = [
          "Product Name",
          "Category",
          "Quantity Sold",
          "Unit",
          "Total Revenue (INR)",
          "Average Price (INR)",
          "Stock Remaining",
        ];
        const rows = data.products.topProducts.map((p) => [
          p.name,
          p.category,
          p.quantitySold,
          p.unit,
          p.revenue,
          p.averagePrice,
          p.stockRemaining ?? "N/A",
        ]);
        exportToCsv(`Product_Sales_${fromLabel}_${toLabel}`, headers, rows);
        toast.success("Products report exported to CSV!");
        break;
      }
      case "customers": {
        const headers = [
          "Customer Name",
          "Mobile",
          "GSTIN",
          "Bills Count",
          "Total Spent (INR)",
          "Total Paid (INR)",
          "Balance (INR)",
          "Last Visit",
        ];
        const rows = data.customers.topCustomers.map((c) => [
          c.name,
          c.mobile,
          c.gstNo || "N/A",
          c.invoicesCount,
          c.totalSpent,
          c.totalPaid,
          c.balance,
          c.lastVisit,
        ]);
        exportToCsv(`Customer_Ledger_${fromLabel}_${toLabel}`, headers, rows);
        toast.success("Customers report exported to CSV!");
        break;
      }
      case "profit": {
        const headers = [
          "Product Name",
          "Category",
          "Quantity Sold",
          "Selling Price (INR)",
          "Cost Price (INR)",
          "Revenue (INR)",
          "Total Cost (INR)",
          "Gross Profit (INR)",
          "Margin (%)",
        ];
        const rows = data.profit.productMargins.map((p) => [
          p.name,
          p.category,
          p.quantitySold,
          p.sellingPrice,
          p.costPrice,
          p.revenue,
          p.totalCost,
          p.grossProfit,
          `${p.marginPercentage}%`,
        ]);
        exportToCsv(`Profit_Margins_${fromLabel}_${toLabel}`, headers, rows);
        toast.success("Profit & margin report exported to CSV!");
        break;
      }
    }
  };

  const tabs = [
    { id: "sales", label: "Sales Summary", icon: TrendingUp },
    { id: "gst", label: "GST & Tax (GSTR-1)", icon: FileSpreadsheet },
    { id: "products", label: "Products", icon: Package },
    { id: "customers", label: "Customers", icon: Users },
    { id: "profit", label: "Profit & Margins", icon: IndianRupee },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header with Date Range and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Business Reports & GST Analytics
            </h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">
              Live Data
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Analyzing period:{" "}
            <span className="font-semibold text-slate-700">
              {new Date(data.dateRange.from).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-slate-700">
              {new Date(data.dateRange.to).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <DateRangeSelector
            currentPreset={preset}
            fromDate={customFrom}
            toDate={customTo}
            onRangeChange={handleRangeChange}
            isLoading={isLoading}
          />
          <Button
            onClick={handleExport}
            size="sm"
            className="h-9 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading Overlay State */}
      {isLoading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm animate-pulse">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">Recalculating Metrics...</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* ========================================================================= */}
          {/* TAB 1: SALES REPORT */}
          {/* ========================================================================= */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              {/* Sales KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Total Revenue</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.sales.summary.totalRevenue)}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Gross Invoiced
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Invoices Generated</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {data.sales.summary.invoiceCount}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Completed Bills
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Average Bill Value</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.sales.summary.averageBillValue)}
                  </div>
                  <span className="text-[11px] text-blue-600 font-bold mt-1 block">
                    Per Transaction
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Collections vs Dues</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.sales.summary.totalPaid)}
                  </div>
                  <span className="text-[11px] text-amber-600 font-bold mt-1 block">
                    Due / Khata: {formatINR(data.sales.summary.totalBalance)}
                  </span>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Timeline Trend */}
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center justify-between">
                    <span>Daily Sales Trend</span>
                    <span className="text-xs font-normal text-slate-500">Revenue (₹)</span>
                  </h3>
                  <div className="h-72 w-full pt-4">
                    {data.sales.timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.sales.timeline}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                          <Tooltip
                            formatter={(value: any) => [formatINR(value), "Sales"]}
                            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="#2563eb"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorRev)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        No transactions found for this date range
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Mode Donut Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <h3 className="text-sm font-bold text-slate-900 mb-1">Payment Modes</h3>
                  <div className="h-56 w-full">
                    {data.sales.paymentModes.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.sales.paymentModes}
                            dataKey="amount"
                            nameKey="mode"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            paddingAngle={3}
                          >
                            {data.sales.paymentModes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => formatINR(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                        No payment data
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                    {data.sales.paymentModes.map((m, idx) => (
                      <div key={m.mode} className="flex items-center justify-between text-slate-600">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                          />
                          {m.mode} ({m.count})
                        </span>
                        <span className="font-bold text-slate-800">
                          {formatINR(m.amount)} ({m.percentage}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Invoices Detailed Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Sales Transactions</h3>
                    <p className="text-xs text-slate-500">
                      Showing {data.sales.invoicesList.length} invoices generated in selected period
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">Invoice No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Mode</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Total Amount</th>
                        <th className="py-2.5 px-3 text-right">Paid</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.sales.invoicesList.slice(0, 50).map((inv) => (
                        <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-2 px-3 font-bold text-blue-600">{inv.invoiceNo}</td>
                          <td className="py-2 px-3 text-slate-500">
                            {new Date(inv.invoiceDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-2 px-3">
                            <span className="font-medium text-slate-900 block">{inv.customerName}</span>
                            <span className="text-[10px] text-slate-400">{inv.customerMobile}</span>
                          </td>
                          <td className="py-2 px-3 font-medium">{inv.paymentMode}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : inv.status === "PARTIAL"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatINR(inv.totalAmount)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-600">
                            {formatINR(inv.paidAmount)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-slate-500">
                            {formatINR(inv.balanceAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: GST & GSTR-1 REPORT */}
          {/* ========================================================================= */}
          {activeTab === "gst" && (
            <div className="space-y-6">
              {/* GST KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Total Taxable Value</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.gst.summary.totalTaxableAmount)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Subtotal before tax</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Total GST Collected</span>
                  <div className="text-2xl font-black text-blue-600 mt-1">
                    {formatINR(data.gst.summary.totalTaxCollected)}
                  </div>
                  <span className="text-[11px] text-blue-700 font-bold mt-1 block">Combined Tax</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">CGST (Central Tax)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.gst.summary.cgst)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">50% Intra-State</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">SGST (State Tax)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.gst.summary.sgst)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">50% Intra-State</span>
                </div>
              </div>

              {/* B2B vs B2C Invoicing Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-800">
                      B2B Invoices (With Customer GSTIN)
                    </span>
                    <p className="text-2xl font-black text-blue-950 mt-1">
                      {formatINR(data.gst.summary.b2bTotal)}
                    </p>
                    <span className="text-xs text-blue-700 font-medium">
                      {data.gst.summary.b2bCount} Invoices • Tax: {formatINR(data.gst.summary.b2bTax)}
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    B2B
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      B2C Retail (Consumer / Walk-in)
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      {formatINR(data.gst.summary.b2cTotal)}
                    </p>
                    <span className="text-xs text-slate-600 font-medium">
                      {data.gst.summary.b2cCount} Invoices • Tax: {formatINR(data.gst.summary.b2cTax)}
                    </span>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                    B2C
                  </div>
                </div>
              </div>

              {/* Tax Slab Summary Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Tax Rate Breakdown (Slab-wise GST Summary)
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Aggregated by tax percentage slab (0%, 5%, 12%, 18%, 28%)
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Tax Slab</th>
                        <th className="py-2.5 px-3 text-right">Items Billed</th>
                        <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                        <th className="py-2.5 px-3 text-right">CGST (₹)</th>
                        <th className="py-2.5 px-3 text-right">SGST (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Tax (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Value (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.gst.slabs.map((slab) => (
                        <tr key={slab.rate} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">{slab.label}</td>
                          <td className="py-2 px-3 text-right text-slate-500">{slab.itemCount}</td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatINR(slab.taxableAmount)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatINR(slab.cgst)}</td>
                          <td className="py-2 px-3 text-right text-slate-600">{formatINR(slab.sgst)}</td>
                          <td className="py-2 px-3 text-right font-bold text-blue-600">
                            {formatINR(slab.totalTax)}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {formatINR(slab.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* GSTR-1 Format Outward Supplies Register */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">GSTR-1 Outward Supplies Register</h3>
                    <p className="text-xs text-slate-500">
                      Audit-ready sales register for monthly and quarterly GST returns filing
                    </p>
                  </div>
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold gap-1.5"
                  >
                    <Download className="h-3.5 w-3.5 text-blue-600" />
                    Download GSTR-1 CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Invoice No</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Type</th>
                        <th className="py-2 px-3">Customer Name</th>
                        <th className="py-2 px-3">GSTIN</th>
                        <th className="py-2 px-3 text-right">Taxable (₹)</th>
                        <th className="py-2 px-3 text-right">CGST (₹)</th>
                        <th className="py-2 px-3 text-right">SGST (₹)</th>
                        <th className="py-2 px-3 text-right">Invoice Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.gst.gstr1Register.slice(0, 50).map((g) => (
                        <tr key={g.invoiceNo} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-blue-600">{g.invoiceNo}</td>
                          <td className="py-2 px-3 text-slate-500">
                            {new Date(g.invoiceDate).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                g.invoiceType === "B2B"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {g.invoiceType}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-900">{g.customerName}</td>
                          <td className="py-2 px-3 font-mono text-[11px] text-slate-600">
                            {g.customerGstNo || "-"}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {formatINR(g.taxableValue)}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">{formatINR(g.cgst)}</td>
                          <td className="py-2 px-3 text-right text-slate-500">{formatINR(g.sgst)}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            {formatINR(g.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PRODUCTS REPORT */}
          {/* ========================================================================= */}
          {activeTab === "products" && (
            <div className="space-y-6">
              {/* Product KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Total Units Sold</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {data.products.summary.totalItemsSold}
                  </div>
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                    Product Quantity
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Product Sales Revenue</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.products.summary.totalProductRevenue)}
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                    Across all items
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Unique Items Sold</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {data.products.summary.uniqueProductsCount}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Catalog active items</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Top Selling Item</span>
                  <div className="text-lg font-black text-slate-900 mt-1 truncate" title={data.products.summary.topProductName}>
                    {data.products.summary.topProductName}
                  </div>
                  <span className="text-[11px] text-purple-600 font-bold mt-1 block">
                    Best Performer
                  </span>
                </div>
              </div>

              {/* Top Products Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Top 10 Products by Revenue
                </h3>
                <p className="text-xs text-slate-500 mb-4">Highest revenue-generating inventory items</p>
                <div className="h-72 w-full">
                  {data.products.topProducts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={data.products.topProducts.slice(0, 10)}
                        layout="vertical"
                        margin={{ left: 40, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" tickFormatter={(v) => `₹${v}`} stroke="#94a3b8" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} width={120} />
                        <Tooltip formatter={(v: any) => formatINR(v)} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No product sales recorded in this period
                    </div>
                  )}
                </div>
              </div>

              {/* Product Performance Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Product Sales Performance</h3>
                <p className="text-xs text-slate-500 mb-4">Quantity, revenue, and remaining inventory</p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Units Sold</th>
                        <th className="py-2 px-3 text-right">Avg Price</th>
                        <th className="py-2 px-3 text-right">Total Revenue</th>
                        <th className="py-2 px-3 text-right">Stock Left</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.products.topProducts.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium">
                              {p.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-medium">
                            {p.quantitySold} {p.unit}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">{formatINR(p.averagePrice)}</td>
                          <td className="py-2 px-3 text-right font-black text-blue-600">
                            {formatINR(p.revenue)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {p.stockRemaining !== null ? (
                              <span
                                className={`font-semibold ${
                                  p.stockRemaining <= 5 ? "text-rose-600" : "text-slate-600"
                                }`}
                              >
                                {p.stockRemaining}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: CUSTOMERS REPORT */}
          {/* ========================================================================= */}
          {activeTab === "customers" && (
            <div className="space-y-6">
              {/* Customer KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Active Customers</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {data.customers.summary.totalCustomers}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Billed in period</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Repeat Customers</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {data.customers.summary.repeatCustomers}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                    {data.customers.summary.totalCustomers > 0
                      ? `${Math.round(
                          (data.customers.summary.repeatCustomers /
                            data.customers.summary.totalCustomers) *
                            100
                        )}% retention`
                      : "0%"}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Average Customer Spend</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.customers.summary.averageSpend)}
                  </div>
                  <span className="text-[11px] text-blue-600 font-semibold mt-1 block">
                    Lifetime value
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Top Spending Customer</span>
                  <div className="text-lg font-black text-slate-900 mt-1 truncate" title={data.customers.summary.topCustomerName}>
                    {data.customers.summary.topCustomerName}
                  </div>
                  <span className="text-[11px] text-purple-600 font-bold mt-1 block">
                    VIP Client
                  </span>
                </div>
              </div>

              {/* Customers Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Customer Sales Ledger</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Customer spend, payments, and outstanding Khata balances
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Customer Name</th>
                        <th className="py-2 px-3">Mobile</th>
                        <th className="py-2 px-3">GSTIN</th>
                        <th className="py-2 px-3 text-right">Bills Count</th>
                        <th className="py-2 px-3 text-right">Total Spent</th>
                        <th className="py-2 px-3 text-right">Paid Amount</th>
                        <th className="py-2 px-3 text-right">Balance Due</th>
                        <th className="py-2 px-3 text-right">Last Visit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.customers.topCustomers.map((c, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">{c.name}</td>
                          <td className="py-2 px-3 font-mono text-slate-600">{c.mobile}</td>
                          <td className="py-2 px-3 font-mono text-slate-500">{c.gstNo || "-"}</td>
                          <td className="py-2 px-3 text-right font-medium">{c.invoicesCount}</td>
                          <td className="py-2 px-3 text-right font-black text-slate-900">
                            {formatINR(c.totalSpent)}
                          </td>
                          <td className="py-2 px-3 text-right font-medium text-emerald-600">
                            {formatINR(c.totalPaid)}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-rose-600">
                            {c.balance > 0 ? formatINR(c.balance) : "₹0"}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">{c.lastVisit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: PROFIT & MARGINS REPORT */}
          {/* ========================================================================= */}
          {activeTab === "profit" && (
            <div className="space-y-6">
              {/* Profit KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Total Revenue</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.profit.summary.totalRevenue)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Gross turnover</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Cost of Goods (COGS)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {formatINR(data.profit.summary.totalCost)}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">Purchase & item cost</span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Estimated Gross Profit</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {formatINR(data.profit.summary.grossProfit)}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                    Revenue − COGS
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-semibold block">Overall Profit Margin</span>
                  <div className="text-2xl font-black text-blue-600 mt-1">
                    {data.profit.summary.marginPercentage}%
                  </div>
                  <span className="text-[11px] text-blue-700 font-bold mt-1 block">
                    Gross Margin
                  </span>
                </div>
              </div>

              {/* Informational tip on cost prices */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-900">
                  <p className="font-bold">Profit Calculation Tip</p>
                  <p className="mt-0.5 text-blue-800">
                    Gross profit is computed using the <strong>Cost Price (Purchase Price)</strong> set on your products in the Products catalog.
                    {data.profit.summary.itemsWithoutCost > 0 && (
                      <span> Note: {data.profit.summary.itemsWithoutCost} item(s) do not have a cost price set yet (calculated at 0 cost). You can edit them in Products to refine margins.</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Daily Profit Timeline Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Daily Revenue vs Gross Profit
                </h3>
                <div className="h-72 w-full pt-4">
                  {data.profit.dailyTimeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.profit.dailyTimeline}>
                        <defs>
                          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `₹${v}`} />
                        <Tooltip formatter={(v: any) => formatINR(v)} />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#2563eb"
                          strokeWidth={2}
                          fillOpacity={0.1}
                          fill="#2563eb"
                        />
                        <Area
                          type="monotone"
                          dataKey="profit"
                          name="Gross Profit"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#profitGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      No profit data recorded in this period
                    </div>
                  )}
                </div>
              </div>

              {/* Product Margins Table */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-1">Item-Wise Profit & Margins</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Breakdown of margins per product sorted by highest profit
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <tr>
                        <th className="py-2 px-3">Product Name</th>
                        <th className="py-2 px-3 text-right">Units</th>
                        <th className="py-2 px-3 text-right">Sell Price</th>
                        <th className="py-2 px-3 text-right">Cost Price</th>
                        <th className="py-2 px-3 text-right">Revenue</th>
                        <th className="py-2 px-3 text-right">Total Cost</th>
                        <th className="py-2 px-3 text-right">Gross Profit</th>
                        <th className="py-2 px-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.profit.productMargins.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 font-bold text-slate-900">{p.name}</td>
                          <td className="py-2 px-3 text-right">{p.quantitySold}</td>
                          <td className="py-2 px-3 text-right text-slate-500">{formatINR(p.sellingPrice)}</td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {p.hasCost ? formatINR(p.costPrice) : <span className="text-slate-400 italic">Not set</span>}
                          </td>
                          <td className="py-2 px-3 text-right font-medium">{formatINR(p.revenue)}</td>
                          <td className="py-2 px-3 text-right text-slate-500">{formatINR(p.totalCost)}</td>
                          <td className="py-2 px-3 text-right font-black text-emerald-600">
                            {formatINR(p.grossProfit)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                p.marginPercentage >= 40
                                  ? "bg-emerald-100 text-emerald-800"
                                  : p.marginPercentage >= 20
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {p.marginPercentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
