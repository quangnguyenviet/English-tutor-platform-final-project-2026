export function PaymentListSkeleton({ rows = 4 }) {
  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-1/4 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-8 w-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export function StatRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-busy="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[98px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}
