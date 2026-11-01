import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse pb-10">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-52 bg-slate-200 rounded-lg" />
          <Skeleton className="h-3.5 w-72 bg-slate-100 rounded" />
        </div>
        <Skeleton className="h-8 w-44 bg-slate-100 rounded-lg" />
      </div>

      {/* 2. 5 Today Stats Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Sales with Cash/Online Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-20 bg-slate-200" />
            <Skeleton className="h-7 w-7 rounded-lg bg-emerald-50" />
          </div>
          <Skeleton className="h-7 w-28 bg-slate-200" />
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <Skeleton className="h-2.5 w-full bg-slate-100" />
            <Skeleton className="h-2.5 w-full bg-slate-100" />
            <Skeleton className="h-2.5 w-2/3 bg-slate-100" />
          </div>
        </div>

        {/* Cards 2-5 */}
        {[
          { color: "bg-red-50", w: "w-24" },
          { color: "bg-purple-50", w: "w-24" },
          { color: "bg-blue-50", w: "w-16" },
          { color: "bg-amber-50", w: "w-24" },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-3 w-20 bg-slate-200" />
                <Skeleton className={`h-7 w-7 rounded-lg ${item.color}`} />
              </div>
              <Skeleton className={`h-7 ${item.w} bg-slate-200 mt-2`} />
            </div>
            <div className="pt-2 border-t border-slate-100">
              <Skeleton className="h-2.5 w-24 bg-slate-100" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. 2 Mini Charts Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-36 bg-slate-200" />
            <Skeleton className="h-3 w-20 bg-slate-100" />
          </div>
          <Skeleton className="h-52 w-full bg-slate-100/70 rounded-lg" />
        </div>

        {/* Line Chart 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-36 bg-slate-200" />
            <Skeleton className="h-3 w-20 bg-slate-100" />
          </div>
          <Skeleton className="h-52 w-full bg-slate-100/70 rounded-lg" />
        </div>
      </div>

      {/* 4. Recent Bills & Expenses Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Bills */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-32 bg-slate-200" />
            <Skeleton className="h-3 w-16 bg-slate-100" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100"
              >
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-24 bg-slate-200" />
                  <Skeleton className="h-2.5 w-32 bg-slate-100" />
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="h-3.5 w-16 bg-slate-200 ml-auto" />
                  <Skeleton className="h-4 w-12 bg-slate-100 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <Skeleton className="h-4 w-32 bg-slate-200" />
            <Skeleton className="h-3 w-20 bg-slate-100" />
          </div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100"
              >
                <div className="space-y-1">
                  <Skeleton className="h-3.5 w-28 bg-slate-200" />
                  <Skeleton className="h-2.5 w-20 bg-slate-100" />
                </div>
                <Skeleton className="h-4 w-14 bg-red-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
