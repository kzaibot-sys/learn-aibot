export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-muted relative overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Skeleton className={`h-4 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 space-y-3">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <SkeletonLine className="w-3/4" />
      <SkeletonLine className="w-1/2" />
      <SkeletonLine className="w-1/3" />
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export function SkeletonCourseRow() {
  return (
    <div className="rounded-3xl bg-card/50 backdrop-blur-sm border border-border/50 p-5 flex items-center gap-4">
      <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
      <Skeleton className="h-5 w-10 shrink-0" />
    </div>
  );
}

export function SkeletonCourseDetail() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-6 w-32" />
      <div className="rounded-3xl border border-border/50 bg-card/50 p-8 space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full rounded-full mt-4" />
        <Skeleton className="h-12 w-48 rounded-2xl mt-2" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <div className="flex items-center gap-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-2xl" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          {[1, 2].map(j => (
            <div key={j} className="rounded-2xl border border-border/50 bg-card/50 px-5 py-4 flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
