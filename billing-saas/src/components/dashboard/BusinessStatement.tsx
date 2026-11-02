"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Printer,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  RotateCcw,
  Calendar,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface StatementEntry {
  id: string;
  date: string; // ISO string
  type: "SALE" | "RETURN" | "EXPENSE";
  title: string;
  reference: string;
  flow: "IN" | "OUT";
  amount: number;
  paymentMode: string;
  customerOrNote?: string;
  balance: number;
}

interface BusinessStatementProps {
  entries: StatementEntry[];
  businessName: string;
}

export function BusinessStatement({
  entries,
  businessName,
}: BusinessStatementProps) {
  const [period, setPeriod] = useState<"today" | "month" | "all">("today");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "SALE" | "RETURN" | "EXPENSE">("ALL");
  const [search, setSearch] = useState("");

  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const monthStr = format(now, "yyyy-MM");

  // Filter entries according to period, type, and search query
  const filteredEntries = useMemo(() => {
    return entries.filter((item) => {
      const itemDate = new Date(item.date);
      const itemDateStr = format(itemDate, "yyyy-MM-dd");
      const itemMonthStr = format(itemDate, "yyyy-MM");

      // Period filter
      if (period === "today" && itemDateStr !== todayStr) return false;
      if (period === "month" && itemMonthStr !== monthStr) return false;

      // Type filter
      if (typeFilter !== "ALL" && item.type !== typeFilter) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchRef = item.reference.toLowerCase().includes(q);
        const matchCust = item.customerOrNote?.toLowerCase().includes(q);
        const matchMode = item.paymentMode.toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchCust && !matchMode) return false;
      }

      return true;
    });
  }, [entries, period, typeFilter, search, todayStr, monthStr]);

  // Totals for filtered period
  const totalIn = useMemo(() => {
    return filteredEntries
      .filter((e) => e.flow === "IN")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const totalOut = useMemo(() => {
    return filteredEntries
      .filter((e) => e.flow === "OUT")
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredEntries]);

  const netCashflow = totalIn - totalOut;

  // Download CSV
  function downloadCSV() {
    const headers = [
      "Date",
      "Time",
      "Type",
      "Description",
      "Reference",
      "Payment Mode",
      "Money In (INR)",
      "Money Out (INR)",
      "Running Balance (INR)",
    ];

    const rows = filteredEntries.map((item) => {
      const d = new Date(item.date);
      const dateFormatted = format(d, "dd/MM/yyyy");
      const timeFormatted = format(d, "hh:mm a");
      const moneyIn = item.flow === "IN" ? item.amount.toFixed(2) : "";
      const moneyOut = item.flow === "OUT" ? item.amount.toFixed(2) : "";
      const desc = item.title.replace(/"/g, '""');

      return [
        `"${dateFormatted}"`,
        `"${timeFormatted}"`,
        `"${item.type}"`,
        `"${desc}"`,
        `"${item.reference}"`,
        `"${item.paymentMode}"`,
        moneyIn,
        moneyOut,
        item.balance.toFixed(2),
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateTag = period === "today" ? todayStr : monthStr;
    link.setAttribute("download", `Statement_${businessName.replace(/\s+/g, "_")}_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Trigger browser print for PDF export
  function handlePrintStatement() {
    window.print();
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
      {/* Print-only CSS styling */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #statement-section, #statement-section * {
            visibility: visible;
          }
          #statement-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .statement-no-print {
            display: none !important;
          }
        }
      `,
        }}
      />

      <div id="statement-section" className="space-y-5">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Account &amp; Cashflow Statement
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Bank-style statement of all Sales, Returns, and Expenses for{" "}
              <strong className="text-slate-700">{businessName}</strong>
            </p>
          </div>

          {/* Action Buttons: PDF/Print & CSV */}
          <div className="flex items-center gap-2 statement-no-print">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadCSV}
              className="h-9 text-xs font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-purple-600" />
              Download CSV
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handlePrintStatement}
              className="h-9 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Download Statement (PDF / Print)
            </Button>
          </div>
        </div>

        {/* Statement Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Money In */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/90 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Inflow (Sales)
              </span>
              <span className="text-xl font-black font-mono text-emerald-700 mt-1 block">
                +₹{totalIn.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">Money collected from bills</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>

          {/* Total Money Out */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/90 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                Total Outflow (Returns &amp; Exp)
              </span>
              <span className="text-xl font-black font-mono text-rose-700 mt-1 block">
                -₹{totalOut.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-rose-600 font-medium">Store expenses &amp; customer refunds</span>
            </div>
            <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>

          {/* Net Cashflow */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              netCashflow >= 0
                ? "bg-purple-50/70 border-purple-200/90 text-purple-950"
                : "bg-red-50/70 border-red-200/90 text-red-950"
            }`}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Net Period Cashflow
              </span>
              <span
                className={`text-xl font-black font-mono mt-1 block ${
                  netCashflow >= 0 ? "text-purple-700" : "text-red-700"
                }`}
              >
                {netCashflow < 0 ? "-" : "+"}₹
                {Math.abs(netCashflow).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Inflow minus outflow
              </span>
            </div>
            <div
              className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                netCashflow >= 0 ? "bg-purple-100 text-purple-700" : "bg-red-100 text-red-700"
              }`}
            >
              {netCashflow >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
            </div>
          </div>
        </div>

        {/* Filter Controls (Hidden in print) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 statement-no-print">
          {/* Period Toggle: Today vs This Month vs All */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setPeriod("today")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === "today"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Today&apos;s Statement
            </button>
            <button
              type="button"
              onClick={() => setPeriod("month")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === "month"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Monthly Statement
            </button>
            <button
              type="button"
              onClick={() => setPeriod("all")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                period === "all"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Recent
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="h-9 px-2.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-600"
            >
              <option value="ALL">All Entries (Sales, Returns, Exp)</option>
              <option value="SALE">Sales (Inflow) Only</option>
              <option value="RETURN">Returns (Refunds) Only</option>
              <option value="EXPENSE">Expenses Only</option>
            </select>

            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Filter statement..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-xs border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Statement Table (Like Bank Statement) */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description / Reference</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Money In (+)</th>
                  <th className="py-3 px-4 text-right">Money Out (-)</th>
                  <th className="py-3 px-4 text-right font-black">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No Statement Transactions Found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        No sales, returns, or expenses match your selected period or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((item) => {
                    const d = new Date(item.date);
                    const dateFormatted = format(d, "dd MMM yyyy");
                    const timeFormatted = format(d, "hh:mm a");

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        {/* Date & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900 block">{dateFormatted}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{timeFormatted}</span>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {item.type === "SALE" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-300"
                            >
                              SALE
                            </Badge>
                          )}
                          {item.type === "RETURN" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-300"
                            >
                              RETURN
                            </Badge>
                          )}
                          {item.type === "EXPENSE" && (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-bold bg-rose-50 text-rose-800 border-rose-300"
                            >
                              EXPENSE
                            </Badge>
                          )}
                        </td>

                        {/* Description / Reference */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 max-w-xs truncate">
                            {item.title}
                          </div>
                          {item.customerOrNote && (
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {item.customerOrNote}
                            </div>
                          )}
                        </td>

                        {/* Mode */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                            {item.paymentMode}
                          </span>
                        </td>

                        {/* Money In */}
                        <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                          {item.flow === "IN" ? (
                            <span className="text-emerald-700">
                              +₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Money Out */}
                        <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                          {item.flow === "OUT" ? (
                            <span className="text-rose-600">
                              -₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Running Balance */}
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 whitespace-nowrap">
                          ₹{item.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BusinessStatement;

