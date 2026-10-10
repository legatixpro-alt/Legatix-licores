'use client'

import { useState, useEffect } from 'react'
import { Producto, Categoria } from '@/types/inventario.types'
import { Cliente, ConfigFiscal } from '@/types/facturacion.types'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
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
  turnoActivoId?: string | null
  initialBcvRate?: number
}

const CATEGORIAS_UNICAS = (productos: Producto[]) => {
  const cats = new Set(productos.map(p => p.categoria_id || 'sin-cat'))
  return Array.from(cats)
}

export function POSClient({ initialProducts: serverProducts, categorias: serverCategorias = [], clientes: serverClientes, configFiscal: serverConfig, empresaId, userId, turnoActivoId, initialBcvRate = 40 }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Local state for hydration
  const [turnoAbierto, setTurnoAbierto] = useState(!!turnoActivoId)
  const [currentTurnoId, setCurrentTurnoId] = useState(turnoActivoId)
  const [initialProducts, setInitialProducts] = useState<Producto[]>(serverProducts)
  const [categorias, setCategorias] = useState<Categoria[]>(serverCategorias)
  const [clientes, setClientes] = useState<Cliente[]>(serverClientes)
  const [configFiscal, setConfigFiscal] = useState<ConfigFiscal | null>(serverConfig)

  const itemCount = usePOSStore(state => state.items.length)
  const addItem = usePOSStore(state => state.addItem)

  // 1. Guardar en IndexedDB si viene data del servidor
  // 2. Leer de IndexedDB si el servidor devuelve arrays vacíos (Offline)
  useEffect(() => {
    const syncLocalCache = async () => {
      try {
        const { getSyncQueue } = await import('@/lib/offline-db') // Re-use the DB init logic
        const db = await (await import('@/lib/offline-db')).initDB()
        const tx = db.transaction('sync_queue', 'readwrite') // we can just use another store later, but for now let's just use localStorage for simplicity
      } catch (e) {
        console.error(e)
      }
    }
  }, [])

  useEffect(() => {
    // Si Server Component logró traer data (Online)
    if (serverProducts.length > 0) {
      localStorage.setItem('pos_cache_productos', JSON.stringify(serverProducts))
      localStorage.setItem('pos_cache_categorias', JSON.stringify(serverCategorias))
      localStorage.setItem('pos_cache_clientes', JSON.stringify(serverClientes))
      localStorage.setItem('pos_cache_config', JSON.stringify(serverConfig))
    } else {
      // Si vinieron vacíos, tratamos de recuperar de localStorage (Offline Mode)
      try {
        const p = localStorage.getItem('pos_cache_productos')
        if (p) setInitialProducts(JSON.parse(p))
        
        const cat = localStorage.getItem('pos_cache_categorias')
        if (cat) setCategorias(JSON.parse(cat))
        
        const cli = localStorage.getItem('pos_cache_clientes')
        if (cli) setClientes(JSON.parse(cli))
        
        const conf = localStorage.getItem('pos_cache_config')
        if (conf) setConfigFiscal(JSON.parse(conf))
      } catch(e) {
        console.error("No se pudo recuperar la caché offline", e)
      }
    }
  }, [serverProducts, serverCategorias, serverClientes, serverConfig])

  // Lógica del Lector de Código de Barras (Pistola)

  useEffect(() => {
    let barcode = ''
    let lastKeyTime = Date.now()

    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar interceptar si está escribiendo normal, a menos que sea muy rápido (escáner)
      const currentTime = Date.now()
      
      if (currentTime - lastKeyTime > 50) {
        barcode = '' // Reiniciar si es tipeo humano lento
      }
      
      lastKeyTime = currentTime

      if (e.key === 'Enter') {
        if (barcode.length >= 4) { // Asumimos que los SKU/Códigos tienen al menos 4 caracteres
          e.preventDefault() // Evitar submit de formularios
          
          const match = initialProducts.find(p => 
            p.codigo_sku?.toLowerCase() === barcode.toLowerCase()
          )
          
          if (match) {
            addItem(match)
            toast.success(`Añadido: ${match.nombre}`, { duration: 1500, position: 'top-center' })
            // Limpiar buscador si estaba enfocado ahí
            const searchInput = document.getElementById('pos-search') as HTMLInputElement
            if (searchInput) searchInput.value = ''
            setSearchTerm('')
          } else {
            toast.error(`Producto no encontrado con el código: ${barcode}`, { position: 'top-center' })
          }
          barcode = ''
        }
      } else if (e.key.length === 1) { // Solo caracteres normales
        barcode += e.key
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [initialProducts, addItem])

  const handleVentaExitosa = (vendidos: any[]) => {
    setInitialProducts(prev => {
      const next = prev.map(p => {
        const vendido = vendidos.find(v => v.producto.id === p.id)
        if (vendido) {
          return { ...p, stock_actual: p.stock_actual - vendido.cantidad }
        }
        return p
      })
      localStorage.setItem('pos_cache_productos', JSON.stringify(next))
      return next
    })
  }

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
      <AperturaCajaModal open={!turnoAbierto} empresaId={empresaId} onSuccess={(id) => { setCurrentTurnoId(id); setTurnoAbierto(true); }} />
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
          {configFiscal && (
            <CartPanel
              clientes={clientes}
              configFiscal={configFiscal}
              empresaId={empresaId}
              userId={userId}
              turnoId={currentTurnoId || undefined}
              initialBcvRate={initialBcvRate}
              onVentaExitosa={handleVentaExitosa}
            />
          )}
        </div>
      </div>

    </div>
  )
}
import { AperturaCajaModal } from './AperturaCajaModal'
