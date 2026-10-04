function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      <div className="h-5 w-14 rounded bg-white/5" />
      <div className="h-5 w-36 rounded bg-white/5" />
      <div className="flex-1 h-5 rounded bg-white/5" />
      <div className="h-5 w-32 rounded bg-white/5" />
      <div className="h-5 w-20 rounded bg-white/5" />
    </div>
  )
}

export default function ClientesLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-52 rounded-lg bg-white/5 mb-2" />
          <div className="h-4 w-40 rounded-lg bg-white/5" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-white/5" />
      </div>
      {/* Search */}
      <div className="h-10 w-full rounded-lg bg-white/5" />
      {/* Table */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {['w-14','w-36','flex-1','w-32','w-20'].map((w, i) => (
            <div key={i} className={`h-4 ${w} rounded bg-white/5`} />
          ))}
        </div>
        {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
