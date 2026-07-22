/** Shared skeleton primitives for route loading states. */
export function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200/90 dark:bg-white/10 ${className}`}
      aria-hidden
    />
  );
}

export function SkeletonCircle({ className = "h-9 w-9" }: { className?: string }) {
  return <SkeletonPulse className={`rounded-full ${className}`} />;
}

export function SkeletonLine({ className = "h-3 w-full" }: { className?: string }) {
  return <SkeletonPulse className={className} />;
}

/** Medium-style feed card placeholder. */
export function SkeletonFeedCard() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonCircle className="h-8 w-8" />
        <SkeletonLine className="h-3 w-28" />
      </div>
      <SkeletonLine className="h-5 w-3/4" />
      <SkeletonLine className="h-3 w-full" />
      <SkeletonLine className="h-3 w-5/6" />
      <SkeletonLine className="h-3 w-2/3" />
    </div>
  );
}

/** Full main-column skeleton used while a route loads. */
export function AppPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" role="status" aria-label="Loading page">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <SkeletonLine className="h-8 w-48" />
          <SkeletonLine className="h-3 w-64" />
        </div>
        <SkeletonPulse className="h-9 w-36 rounded-card" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card space-y-3">
            <SkeletonLine className="h-3 w-20" />
            <SkeletonLine className="h-7 w-28" />
            <SkeletonLine className="h-3 w-16" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SkeletonFeedCard />
          <SkeletonFeedCard />
        </div>
        <div className="card space-y-4">
          <SkeletonLine className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonPulse key={i} className="h-10 rounded-lg" />
            ))}
          </div>
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-4/5" />
          <SkeletonPulse className="mt-2 h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
