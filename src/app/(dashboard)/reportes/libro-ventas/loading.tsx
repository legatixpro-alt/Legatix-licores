function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      <div className="h-5 w-20 rounded bg-white/5" />
      <div className="h-5 w-32 rounded bg-white/5" />
      <div className="flex-1 h-5 rounded bg-white/5" />
      <div className="h-5 w-20 rounded bg-white/5" />
      <div className="h-5 w-20 rounded bg-white/5" />
      <div className="h-5 w-20 rounded bg-white/5" />
    </div>
  )
}

export default function LibroVentasLoading() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      <div>
        <div className="h-7 w-48 rounded-lg bg-white/5 mb-2" />
        <div className="h-4 w-80 rounded-lg bg-white/5" />
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <div className="h-10 w-32 rounded-lg bg-white/5" />
        <div className="h-10 w-32 rounded-lg bg-white/5" />
        <div className="h-10 w-32 rounded-lg bg-white/5" />
      </div>
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-white/5 h-24" />
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {['w-20','w-32','flex-1','w-20','w-20','w-20'].map((w, i) => (
            <div key={i} className={`h-4 ${w} rounded bg-white/5`} />
          ))}
        </div>
        {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
