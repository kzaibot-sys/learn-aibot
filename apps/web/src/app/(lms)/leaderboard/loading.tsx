export default function LeaderboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 skeleton rounded-xl w-56" />
        <div className="h-4 skeleton rounded-xl w-80" />
      </div>
      {/* Podium */}
      <div className="flex justify-center gap-6 max-w-lg mx-auto">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 skeleton rounded-full" />
            <div className="h-3 skeleton rounded-xl w-16" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="rounded-3xl border border-border/50 overflow-hidden space-y-0">
        <div className="h-10 skeleton rounded-none" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 skeleton rounded-none border-t border-border/30" />
        ))}
      </div>
    </div>
  );
}
