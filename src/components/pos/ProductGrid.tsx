'use client'

import { Producto } from '@/types/inventario.types'
import { usePOSStore } from '@/store/posStore'
import { Package, Plus } from 'lucide-react'

export function ProductGrid({ products }: { products: Producto[] }) {
  const addItem = usePOSStore(state => state.addItem)

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-16">
        <Package className="h-12 w-12 opacity-20" />
        <p className="text-sm">No se encontraron productos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map(producto => (
        <button
          key={producto.id}
          onClick={() => addItem(producto)}
          className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/60 hover:bg-primary/5 hover:shadow-[0_0_16px_rgba(245,176,39,0.15)] active:scale-95 select-none focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {/* Stock badge */}
          <span className="absolute top-2 right-2 text-[10px] font-semibold bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
            {producto.stock_actual}u
          </span>

          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-mono text-muted-foreground/70 truncate">{producto.codigo_sku}</p>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {producto.nombre}
            </h3>
          </div>

          <div className="flex items-end justify-between mt-3">
            <div className="flex flex-col">
              <span className="text-base font-bold text-foreground">${producto.precio_venta_usd.toFixed(2)}</span>
              <span className="text-[10px] text-muted-foreground">Bs. {producto.precio_venta.toFixed(2)}</span>
            </div>
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:border-primary transition-all">
              <Plus className="h-3.5 w-3.5 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
