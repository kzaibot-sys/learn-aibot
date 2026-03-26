export default function AchievementsLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* XP bar */}
      <div className="h-24 skeleton rounded-3xl" />
      {/* Unlocked section */}
      <div className="space-y-4">
        <div className="h-6 skeleton rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-3xl" />
          ))}
        </div>
      </div>
      {/* Locked section */}
      <div className="space-y-4">
        <div className="h-6 skeleton rounded-xl w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
