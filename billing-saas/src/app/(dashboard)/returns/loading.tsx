import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReturnsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 bg-slate-200" />
          <Skeleton className="h-4 w-72 bg-slate-100" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100">
              <Skeleton className="h-4 w-32 bg-slate-200" />
              <Skeleton className="h-4 w-28 bg-slate-100" />
              <Skeleton className="h-4 w-20 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
