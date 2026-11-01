import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoicesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 bg-slate-200" />
          <Skeleton className="h-4 w-96 bg-slate-100" />
        </div>
        <Skeleton className="h-9 w-36 bg-slate-200 rounded-lg" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <Skeleton className="h-10 w-10 rounded-xl bg-slate-100" />
            <Skeleton className="h-6 w-28 bg-slate-200" />
            <Skeleton className="h-3 w-20 bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <Skeleton className="h-9 w-60 bg-slate-100 rounded-lg" />
          <Skeleton className="h-9 w-32 bg-slate-100 rounded-lg" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
              <Skeleton className="h-4 w-28 bg-slate-200" />
              <Skeleton className="h-4 w-36 bg-slate-100" />
              <Skeleton className="h-4 w-20 bg-slate-100" />
              <Skeleton className="h-4 w-24 bg-slate-200" />
              <Skeleton className="h-6 w-16 bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
