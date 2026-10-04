'use client'

import { useState } from 'react'
import { Plus, Search, Package, AlertTriangle, TrendingUp, ArchiveRestore, Edit2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductoFormDialog } from './ProductoFormDialog'
import { KardexFormDialog } from './KardexFormDialog'

interface Producto {
  id: string
  codigo_sku: string
  nombre: string
  descripcion?: string
  precio_venta_usd: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  es_licor: boolean
  es_promo: boolean
  activo: boolean
  categorias?: { nombre: string } | null
  proveedores?: { razon_social: string } | null
}

interface Props {
  initialData: Producto[]
  empresaId: string
}

export function InventarioClient({ initialData, empresaId }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [kardexOpen, setKardexOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string; nombre: string; stock_actual: number
  } | null>(null)

  const filteredData = initialData.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo_sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stockBajo = initialData.filter(p => p.stock_actual <= p.stock_minimo && p.activo).length
  const totalProductos = initialData.filter(p => p.activo).length
  const totalLicores = initialData.filter(p => p.es_licor && p.activo).length

  const handleOpenKardex = (producto: Producto) => {
    setSelectedProduct({ id: producto.id, nombre: producto.nombre, stock_actual: producto.stock_actual })
    setKardexOpen(true)
  }

  return (
    <div className="space-y-5">

      {/* ── Stats rápidas ─────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Productos */}
        <Card className="glass-card border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate mr-2">Total Productos</CardTitle>
            <div className="p-2 bg-black/50 rounded-lg border border-white/5 shadow-inner group-hover:border-primary/40 transition-colors flex-shrink-0 text-primary">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-sm truncate">{totalProductos}</div>
          </CardContent>
        </Card>

        {/* Licores */}
        <Card className="glass-card border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate mr-2">Licores</CardTitle>
            <div className="p-2 bg-black/50 rounded-lg border border-white/5 shadow-inner group-hover:border-primary/40 transition-colors flex-shrink-0 text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-sm truncate">{totalLicores}</div>
          </CardContent>
        </Card>

        {/* Stock Bajo */}
        <Card className="glass-card border-border/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate mr-2">Stock Bajo</CardTitle>
            <div className="p-2 bg-black/50 rounded-lg border border-white/5 shadow-inner group-hover:border-red-500/40 transition-colors flex-shrink-0 text-red-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className={`text-2xl font-extrabold tracking-tight drop-shadow-sm truncate ${stockBajo > 0 ? 'text-red-500' : 'text-foreground'}`}>
              {stockBajo}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Barra de herramientas ─────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="inventario-search"
            placeholder="Buscar por nombre o SKU..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* ── Tabla ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">SKU</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Nombre</TableHead>
              <TableHead className="text-muted-foreground font-semibold text-xs uppercase tracking-wider">Categoría</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold text-xs uppercase tracking-wider">Precio USD</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold text-xs uppercase tracking-wider">Precio VES</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold text-xs uppercase tracking-wider">Stock</TableHead>
              <TableHead className="text-center text-muted-foreground font-semibold text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="text-right text-muted-foreground font-semibold text-xs uppercase tracking-wider">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Package className="h-10 w-10 opacity-20" />
                    <p className="text-sm">
                      {searchTerm
                        ? `No se encontraron productos con "${searchTerm}"`
                        : 'No hay productos registrados. Crea el primero.'
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((producto) => {
                const stockCritico = producto.stock_actual <= producto.stock_minimo
                return (
                  <TableRow key={producto.id} className="border-border hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {producto.codigo_sku}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{producto.nombre}</span>
                        {producto.es_licor && (
                          <span className="text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md">
                            Licor
                          </span>
                        )}
                        {producto.es_promo && (
                          <span className="text-[10px] font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            🔥 Promo
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {producto.categorias?.nombre || <span className="opacity-40">—</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-foreground text-sm">
                      ${producto.precio_venta_usd.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground text-sm">
                      Bs. {producto.precio_venta.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold text-sm tabular-nums ${stockCritico ? 'text-red-400' : 'text-foreground'}`}>
                        {producto.stock_actual}
                        {stockCritico && (
                          <AlertTriangle className="inline h-3 w-3 ml-1 mb-0.5 text-red-400" />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {producto.activo ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          onClick={() => handleOpenKardex(producto)}
                          title="Ajustar Stock"
                        >
                          <ArchiveRestore className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ProductoFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} empresaId={empresaId} />
      <KardexFormDialog open={kardexOpen} onOpenChange={setKardexOpen} producto={selectedProduct} />
    </div>
  )
}
