function ProductSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-white/5 p-4 flex flex-col gap-3">
      <div className="h-5 w-3/4 rounded bg-white/5" />
      <div className="h-4 w-1/2 rounded bg-white/5" />
      <div className="flex justify-between mt-2">
        <div className="h-6 w-20 rounded bg-white/5" />
        <div className="h-6 w-16 rounded bg-white/5" />
      </div>
    </div>
  )
}

export default function InventarioLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-36 rounded-lg bg-white/5 mb-2" />
          <div className="h-4 w-72 rounded-lg bg-white/5" />
        </div>
      </div>
      {/* Tabs + search */}
      <div className="flex gap-3">
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-white/5" />
          ))}
        </div>
        <div className="flex-1 h-9 rounded-lg bg-white/5" />
        <div className="h-9 w-32 rounded-lg bg-white/5" />
      </div>
      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    </div>
  )
}
