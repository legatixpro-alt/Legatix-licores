function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/50">
      <div className="h-5 w-32 rounded bg-white/5" />
      <div className="h-5 w-48 rounded bg-white/5" />
      <div className="h-5 w-16 rounded bg-white/5" />
      <div className="h-5 w-24 rounded bg-white/5" />
    </div>
  )
}

export default function UsuariosLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-40 rounded-lg bg-white/5 mb-2" />
          <div className="h-4 w-56 rounded-lg bg-white/5" />
        </div>
        <div className="h-9 w-36 rounded-lg bg-white/5" />
      </div>
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex gap-4 px-4 py-3 border-b border-border bg-muted/40">
          {['w-32','w-48','w-16','w-24'].map((w, i) => (
            <div key={i} className={`h-4 ${w} rounded bg-white/5`} />
          ))}
        </div>
        {[...Array(6)].map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  )
}
