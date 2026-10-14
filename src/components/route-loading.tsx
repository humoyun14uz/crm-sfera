import { Skeleton } from '@/components/ui/skeleton'

export function RouteLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 animate-in fade-in duration-300">
      {/* Header bar skeleton */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md opacity-70" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      </div>

      {/* KPI stats card grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm"
          >
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="size-8 rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-7 w-28 rounded-md" />
              <Skeleton className="h-3.5 w-36 rounded opacity-80" />
            </div>
          </div>
        ))}
      </div>

      {/* Main content / Chart / Table area skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border/60 bg-card p-5 lg:col-span-2 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="size-5 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-3 w-2/3 rounded opacity-70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
