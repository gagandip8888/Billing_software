import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function BillingLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-pulse">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
        <div className="space-y-1">
          <Skeleton className="h-7 w-60 bg-slate-200" />
          <Skeleton className="h-3.5 w-80 bg-slate-100" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <Skeleton className="h-4 w-32 bg-slate-200" />
            <Skeleton className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <Skeleton className="h-5 w-40 bg-slate-200" />
            <Skeleton className="h-28 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <Skeleton className="h-6 w-32 bg-slate-200" />
            <Skeleton className="h-16 w-full bg-slate-100 rounded-lg" />
            <Skeleton className="h-10 w-full bg-slate-200 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
