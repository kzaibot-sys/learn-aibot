export default function CertificatesLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 skeleton rounded-xl w-48" />
        <div className="h-4 skeleton rounded-xl w-72" />
      </div>
      {/* Certificate cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 skeleton rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
