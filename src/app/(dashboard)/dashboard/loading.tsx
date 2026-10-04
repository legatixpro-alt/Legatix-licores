export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div>
        <div className="h-8 w-56 rounded-lg bg-white/5 mb-2" />
        <div className="h-4 w-72 rounded-lg bg-white/5" />
      </div>
      {/* Metric cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-border/50 bg-white/5 p-5 h-28" />
        ))}
      </div>
      {/* Chart + Quick access */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4 rounded-xl border border-border/50 bg-white/5 h-64" />
        <div className="col-span-3 rounded-xl border border-border/50 bg-white/5 h-64" />
      </div>
    </div>
  )
}
