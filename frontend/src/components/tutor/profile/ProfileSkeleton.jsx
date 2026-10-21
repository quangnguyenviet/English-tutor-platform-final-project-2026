export default function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Page header skeleton */}
      <div className="flex flex-col gap-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Banner skeleton */}
      <div className="rounded-xl border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-800 animate-pulse h-20" />

      {/* Content skeleton — lưới các card thông tin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-32 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
