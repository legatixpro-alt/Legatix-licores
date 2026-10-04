'use client'

import { useState } from 'react'
import { Producto, Categoria } from '@/types/inventario.types'
import { Cliente, ConfigFiscal } from '@/types/facturacion.types'
import { Input } from '@/components/ui/input'
import { Search, Package, ScanLine } from 'lucide-react'
import { ProductGrid } from './ProductGrid'
import { CartPanel } from './CartPanel'
import { usePOSStore } from '@/store/posStore'

interface Props {
  initialProducts: Producto[]
  categorias?: Categoria[]
  clientes: Cliente[]
  configFiscal: ConfigFiscal
  empresaId: string
  userId: string
}

const CATEGORIAS_UNICAS = (productos: Producto[]) => {
  const cats = new Set(productos.map(p => p.categoria_id || 'sin-cat'))
  return Array.from(cats)
}

export function POSClient({ initialProducts, categorias = [], clientes, configFiscal, empresaId, userId }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const itemCount = usePOSStore(state => state.items.length)

  const filteredProducts = initialProducts.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchCat = false
    if (selectedCategory === null) {
      matchCat = true
    } else if (selectedCategory === 'promos-hardcoded') {
      const lower = p.nombre.toLowerCase()
      matchCat = p.es_promo === true || lower.includes('promo') || lower.includes('balde') || lower.includes('combo') || lower.includes('oferta')
    } else {
      matchCat = p.categoria_id === selectedCategory
    }

    return matchSearch && matchCat
  })

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[calc(100vh-12rem)] lg:h-[calc(100vh-5rem)] gap-4 lg:-m-6 lg:p-4">

      {/* ── Products zone ─────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-3 min-h-[300px] lg:overflow-hidden order-1">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none flex-shrink-0">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border ${
              selectedCategory === null
                ? 'bg-primary text-primary-foreground border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
            }`}
          >
            Todos
          </button>
          
          <button
            onClick={() => setSelectedCategory('promos-hardcoded')}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
              selectedCategory === 'promos-hardcoded'
                ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            🔥 Promociones
          </button>

          {categorias.map(c => {
            const isPromo = c.nombre.toLowerCase().includes('promo')
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? isPromo 
                      ? 'bg-amber-500 text-black border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                      : 'bg-primary text-primary-foreground border-primary shadow-md'
                    : isPromo
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}
              >
                {isPromo && <span>🔥</span>}
                {c.nombre}
              </button>
            )
          })}
        </div>

        {/* Search bar */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="pos-search"
            placeholder="Buscar por nombre o código SKU..."
            className="pl-10 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-primary/50 focus-visible:border-primary/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between px-1 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="h-3.5 w-3.5" />
            <span>
              {filteredProducts.length === initialProducts.length
                ? `${initialProducts.length} productos disponibles`
                : `${filteredProducts.length} de ${initialProducts.length} resultados`
              }
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ScanLine className="h-3.5 w-3.5" />
            <span>Click para añadir</span>
          </div>
        </div>

        {/* Product grid — scrollable on desktop, inline on mobile */}
        <div className="flex-1 lg:overflow-y-auto pb-2 pr-1 scrollbar-thin">
          <ProductGrid products={filteredProducts} />
        </div>
      </div>

      {/* ── Cart sidebar ──────────────────────────────── */}
      <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 order-2 flex flex-col max-h-[80vh] lg:max-h-full">
        <div className="flex-1 rounded-xl border border-border bg-card shadow-xl shadow-black/30 overflow-hidden flex flex-col">
          <CartPanel
            clientes={clientes}
            configFiscal={configFiscal}
            empresaId={empresaId}
            userId={userId}
          />
        </div>
      </div>

    </div>
  )
}
