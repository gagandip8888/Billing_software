"use client";

import React, { useEffect, useState } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  Loader2,
  TrendingDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ExpenseItem {
  id: string;
  title: string;
  amount: number;
  date: string;
  createdAt: string;
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expenses");
      if (!res.ok) throw new Error("Failed to load expenses");
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter an expense title (e.g., Tea, Electricity)");
      return;
    }
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid expense amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          amount: val,
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record expense");

      toast.success(`Expense "₹${val} - ${title}" added!`);
      setTitle("");
      setAmount("");
      setDate(new Date().toISOString().split("T")[0]);
      await fetchExpenses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Could not save expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, expTitle: string) => {
    if (!confirm(`Delete expense "${expTitle}"?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      toast.success("Expense deleted");
      setExpenses((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  // Quick stats
  const totalAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayAmount = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/10 text-purple-600 shrink-0">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Shop Expenses (Kharch)
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Track daily store running costs, tea, utilities, rent & miscellaneous expenses
              </p>
            </div>
          </div>
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 sm:gap-3">
          <div className="bg-white border rounded-xl px-3.5 sm:px-4 py-2 shadow-sm text-right">
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Today's Kharch
            </div>
            <div className="text-base sm:text-lg font-bold text-red-600">
              ₹{todayAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="bg-white border rounded-xl px-3.5 sm:px-4 py-2 shadow-sm text-right">
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Total Recorded
            </div>
            <div className="text-base sm:text-lg font-bold text-slate-900">
              ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-purple-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Record New Expense
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 md:items-end">
          {/* Title */}
          <div className="flex-1 min-w-0 space-y-1.5 w-full">
            <Label htmlFor="exp-title" className="text-xs font-semibold text-slate-700">
              Expense Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="exp-title"
              placeholder="e.g. Tea & Refreshments, Electricity, Shop Rent..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 text-sm focus-visible:ring-purple-500 w-full"
              required
            />
          </div>

          {/* Amount */}
          <div className="w-full md:w-48 space-y-1.5 shrink-0">
            <Label htmlFor="exp-amount" className="text-xs font-semibold text-slate-700">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">₹</span>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 pl-7 text-sm font-medium focus-visible:ring-purple-500 w-full"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div className="w-full md:w-44 space-y-1.5 shrink-0">
            <Label htmlFor="exp-date" className="text-xs font-semibold text-slate-700">
              Date
            </Label>
            <Input
              id="exp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 text-sm focus-visible:ring-purple-500 w-full"
            />
          </div>

          {/* Submit Button */}
          <div className="w-full md:w-auto shrink-0 pt-1 md:pt-0">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-5 h-10 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs tracking-wide shadow-sm"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Expense
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Expenses List Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">Expense History</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {expenses.length} records
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
            <p className="text-xs">Loading shop expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Receipt className="h-10 w-10 mx-auto text-slate-300 mb-2 stroke-[1.5]" />
            <p className="text-sm font-semibold text-slate-700">No Expenses Recorded</p>
            <p className="text-xs text-slate-400 mt-1">
              Add your first daily expense using the form above.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <Table className="min-w-[550px] w-full">
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="w-[140px] text-xs font-bold text-slate-700">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Title / Description</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-700">Amount (₹)</TableHead>
                  <TableHead className="w-[100px] text-center text-xs font-bold text-slate-700">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((item) => {
                  const isDeleting = deletingId === item.id;
                  const formattedDate = new Date(item.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <TableCell className="text-xs font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formattedDate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono font-bold text-red-600 whitespace-nowrap">
                        ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => handleDelete(item.id, item.title)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg"
                          title="Delete expense"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
