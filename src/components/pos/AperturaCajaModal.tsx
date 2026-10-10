'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  empresaId: string
  onSuccess: (turnoId: string) => void
}

export function AperturaCajaModal({ open, empresaId, onSuccess }: Props) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [efectivoVes, setEfectivoVes] = useState('')
  const [efectivoUsd, setEfectivoUsd] = useState('')
  const supabase = createClient()

  const handleApertura = async () => {
    setIsProcessing(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error('No estás autenticado')

      const { data, error } = await supabase.from('cajas_turnos').insert({
        empresa_id: empresaId,
        usuario_id: userData.user.id,
        monto_apertura_ves: parseFloat(efectivoVes || '0') || 0,
        monto_apertura_usd: parseFloat(efectivoUsd || '0') || 0,
        estatus: 'ABIERTO'
      }).select('id').single()

      if (error) throw error

      toast.success('Caja Abierta', { description: 'Turno iniciado correctamente.' })
      onSuccess(data.id)
    } catch (e: any) {
      toast.error('Error abriendo caja', { description: e.message })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}> 
      {/* No permitimos cerrar clickeando fuera, es OBLIGATORIO abrir caja */}
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Apertura de Caja</DialogTitle>
          <DialogDescription>
            Para comenzar a facturar, declare el efectivo inicial (fondo de caja) disponible en la gaveta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Fondo en Bolívares (VES)</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              value={efectivoVes}
              onChange={e => setEfectivoVes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fondo en Dólares (USD)</Label>
            <Input 
              type="number" 
              placeholder="0.00" 
              value={efectivoUsd}
              onChange={e => setEfectivoUsd(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={handleApertura} 
            disabled={isProcessing}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isProcessing ? 'Procesando...' : 'Abrir Turno'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
