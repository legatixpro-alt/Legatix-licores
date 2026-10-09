'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatUSD } from '@/lib/fiscal'
import { getTasaBcv, forceSyncTasaBcv } from '@/app/actions/bcv'
import { registrarPago } from '@/app/actions/pagos'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from 'cn'

interface Props {
  isOpen: boolean
  onClose: () => void
  facturaId: string
  numeroFactura: string
  saldoPendiente: number
  onSuccess: () => void
}

export function RegistrarPagoModal({ isOpen, onClose, facturaId, numeroFactura, saldoPendiente, onSuccess }: Props) {
  const [metodo, setMetodo] = useState('EFECTIVO_BS')
  const [montoIngresado, setMontoIngresado] = useState<number | ''>('')
  const [referencia, setReferencia] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [tasaBcvHoy, setTasaBcvHoy] = useState(40)
  const [isFetchingBcv, setIsFetchingBcv] = useState(false)

  const fetchBcv = async () => {
    setIsFetchingBcv(true)
    const res = await getTasaBcv()
    if (res.success && res.tasa) {
      setTasaBcvHoy(res.tasa)
      // Si el método seleccionado es VES, recalculamos el monto precargado en Bs
      const isBs = !['EFECTIVO_USD', 'ZELLE'].includes(metodo)
      if (isBs) {
        setMontoIngresado(Number((saldoPendiente * res.tasa).toFixed(2)))
      }
    }
    setIsFetchingBcv(false)
  }

  const handleForceSync = async () => {
    setIsFetchingBcv(true)
    const res = await forceSyncTasaBcv()
    if (res.success && res.tasa) {
      setTasaBcvHoy(res.tasa)
      const isBs = !['EFECTIVO_USD', 'ZELLE'].includes(metodo)
      if (isBs) {
        setMontoIngresado(Number((saldoPendiente * res.tasa).toFixed(2)))
      }
    }
    setIsFetchingBcv(false)
  }

  const isMetodoUsd = (m: string) => m === 'EFECTIVO_USD' || m === 'ZELLE'

  // Cargar tasa al abrir el modal y pre-llenar monto
  useEffect(() => {
    if (isOpen) {
      fetchBcv()
      if (isMetodoUsd(metodo)) {
        setMontoIngresado(saldoPendiente)
      } else {
        setMontoIngresado(Number((saldoPendiente * tasaBcvHoy).toFixed(2)))
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Cambiar de método recalcula el pre-llenado automáticamente
  const handleMetodoChange = (nuevoMetodo: string) => {
    setMetodo(nuevoMetodo)
    if (isMetodoUsd(nuevoMetodo)) {
      setMontoIngresado(saldoPendiente)
    } else {
      setMontoIngresado(Number((saldoPendiente * tasaBcvHoy).toFixed(2)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!montoIngresado || montoIngresado <= 0) {
      setError('Ingrese un monto válido')
      return
    }
    
    // Calculamos el monto real en USD que se va a abonar a la deuda
    const esUsd = isMetodoUsd(metodo)
    const montoUSD = !esUsd 
      ? Number((montoIngresado / tasaBcvHoy).toFixed(4))
      : montoIngresado

    // Permitimos un margen de error de 0.01 por redondeo de decimales
    if (montoUSD > saldoPendiente + 0.01) {
      setError(`El monto no puede exceder el saldo pendiente (${formatUSD(saldoPendiente)}). Equivalente ingresado: ${formatUSD(montoUSD)}`)
      return
    }

    setLoading(true)
    setError(null)
    
    // Convertir el método al enum moneda_pago válido (USD o VES) para evitar error en BD
    const monedaDb = esUsd ? 'USD' : 'VES'

    const res = await registrarPago({
      factura_id: facturaId,
      moneda: monedaDb,
      monto: montoUSD,
      referencia,
      tasa_bcv_dia: tasaBcvHoy
    })
    
    if (res.success) {
      onSuccess()
    } else {
      setError(res.error || 'Ocurrió un error al registrar el pago')
    }
    
    setLoading(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Registrar Pago - Factura {numeroFactura}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-3 flex justify-between items-center mb-2">
            <span className="text-sm font-semibold">Deuda Total (USD):</span>
            <span className="text-lg font-bold">{formatUSD(saldoPendiente)}</span>
          </div>

          <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-md mb-4 border border-border/50">
            <span className="text-xs text-muted-foreground font-medium">Tasa BCV del Día:</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">Bs. {tasaBcvHoy}</span>
              <button 
                type="button" 
                onClick={handleForceSync} 
                disabled={isFetchingBcv}
                className="p-1 rounded-md hover:bg-secondary/80 text-muted-foreground transition-colors"
                title="Actualizar Tasa BCV Oficial"
              >
                <RefreshCw className={cn("h-3 w-3", isFetchingBcv && "animate-spin")} />
              </button>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label>Método de Pago</Label>
            <select
              value={metodo}
              onChange={e => handleMetodoChange(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="EFECTIVO_BS">Efectivo Bs.</option>
              <option value="EFECTIVO_USD">Efectivo $</option>
              <option value="PAGO_MOVIL">Pago Móvil</option>
              <option value="TARJETA_DEBITO">Tarj. Débito</option>
              <option value="TARJETA_CREDITO">Tarj. Crédito</option>
            </select>
          </div>
          
          <div className="grid gap-2">
            <Label>{!isMetodoUsd(metodo) ? 'Monto a Abonar (en Bs.)' : 'Monto a Abonar (en USD)'}</Label>
            <Input
              type="number"
              step="0.01"
              value={montoIngresado}
              onChange={e => setMontoIngresado(parseFloat(e.target.value) || '')}
              placeholder="0.00"
              required
            />
            {!isMetodoUsd(metodo) && montoIngresado && (
              <p className="text-xs text-muted-foreground font-medium mt-1">
                Equivalente restado a la deuda: <span className="text-primary font-bold">{formatUSD(Number(montoIngresado) / tasaBcvHoy)}</span>
              </p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label>Referencia (Opcional)</Label>
            <Input
              value={referencia}
              onChange={e => setReferencia(e.target.value)}
              placeholder="Nro de recibo o transferencia"
            />
          </div>
          
          {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
          
          <DialogFooter className="pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
