'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { registrarMovimientoKardex } from '@/app/actions/kardex'
import { TipoMovimientoKardex } from '@/types/inventario.types'

interface Props {
  producto: { id: string, nombre: string, stock_actual: number } | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KardexFormDialog({ producto, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tipo, setTipo] = useState<TipoMovimientoKardex>('entrada')
  const [cantidad, setCantidad] = useState<number>(0)
  const [motivo, setMotivo] = useState('')

  if (!producto) return null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (cantidad <= 0 && tipo !== 'ajuste') {
      setError('La cantidad debe ser mayor a cero')
      return
    }

    setLoading(true)
    setError(null)

    const res = await registrarMovimientoKardex({
      producto_id: producto.id,
      tipo,
      cantidad,
      motivo
    })

    setLoading(false)

    if (res.success) {
      setTipo('entrada')
      setCantidad(0)
      setMotivo('')
      onOpenChange(false)
    } else {
      setError(res.error || 'Ocurrió un error al registrar el movimiento')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-black/95 border-white/10 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Ajuste de Stock</DialogTitle>
          <DialogDescription>
            Registrar movimiento manual para <b>{producto.nombre}</b>.
            <br />
            Stock Actual: <b>{producto.stock_actual}</b>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 p-2 rounded">{error}</p>}

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Tipo de Movimiento</Label>
            <select
              required
              value={tipo}
              onChange={e => setTipo(e.target.value as TipoMovimientoKardex)}
              className="w-full flex h-10 items-center justify-between rounded-md border bg-white/5 border-white/10 px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value="entrada" className="bg-zinc-900 text-white">Entrada (+)</option>
              <option value="salida" className="bg-zinc-900 text-white">Salida (-)</option>
              <option value="merma" className="bg-zinc-900 text-white">Merma/Daño (-)</option>
              <option value="ajuste" className="bg-zinc-900 text-white">Ajuste Libre</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Cantidad</Label>
            <Input 
              type="number" 
              required
              value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              placeholder="Ej: 5"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Motivo / Observación</Label>
            <Input 
              required
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Ej: Ingreso de proveedor, botella rota..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-white/10">Cancelar</Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground font-bold hover:bg-primary/90">
              {loading ? 'Guardando...' : 'Registrar Movimiento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
