export default function ConfiguracionLoading() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
      <div>
        <div className="h-7 w-56 rounded-lg bg-white/5 mb-2" />
        <div className="h-4 w-80 rounded-lg bg-white/5" />
      </div>
      {/* Form card */}
      <div className="rounded-xl border border-border/50 bg-card p-6 flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-white/5" />
              <div className="h-9 w-full rounded-lg bg-white/5" />
            </div>
          ))}
        </div>
        <div className="h-9 w-32 rounded-lg bg-white/5 self-end" />
      </div>
    </div>
  )
}
