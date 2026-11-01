import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2 pb-4 border-b border-slate-200">
        <Skeleton className="h-7 w-48 bg-slate-200" />
        <Skeleton className="h-4 w-72 bg-slate-100" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40 bg-slate-200" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full bg-slate-100 rounded-lg" />
            <Skeleton className="h-10 w-full bg-slate-100 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
