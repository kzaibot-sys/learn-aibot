export default function CoursesLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Search bar skeleton */}
      <div className="h-12 skeleton rounded-2xl max-w-lg" />
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 skeleton rounded-2xl" />
        ))}
      </div>
      {/* Courses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 skeleton rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
