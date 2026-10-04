export default function POSLoading() {
  return (
    <div className="flex h-[calc(100vh-6rem)] -m-6 p-4 gap-4 animate-pulse">
      {/* Products panel */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="h-10 w-full rounded-lg bg-white/5" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-20 rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border/50 bg-white/5 h-32" />
          ))}
        </div>
      </div>
      {/* Cart panel */}
      <div className="w-96 flex flex-col gap-4 rounded-xl border border-border/50 bg-white/5 p-4">
        <div className="h-6 w-32 rounded bg-white/5" />
        <div className="flex-1 flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="h-28 rounded-xl bg-white/5" />
        <div className="h-12 w-full rounded-lg bg-white/5" />
      </div>
    </div>
  )
}
