import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 bg-slate-800" />
          <Skeleton className="h-4 w-72 bg-slate-800/60" />
        </div>
        <Skeleton className="h-10 w-32 bg-slate-800" />
      </div>

      {/* Metrics cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-800" />
            </div>
            <Skeleton className="h-8 w-36 bg-slate-800" />
            <Skeleton className="h-3 w-28 bg-slate-800/60" />
          </div>
        ))}
      </div>

      {/* Content area / Chart skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
          <Skeleton className="h-6 w-40 bg-slate-800" />
          <Skeleton className="h-64 w-full bg-slate-800/40 rounded-lg" />
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50 space-y-4">
          <Skeleton className="h-6 w-32 bg-slate-800" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-slate-800/50">
                <Skeleton className="h-4 w-28 bg-slate-800" />
                <Skeleton className="h-4 w-16 bg-slate-800" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
