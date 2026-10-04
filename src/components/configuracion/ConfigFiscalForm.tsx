'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { guardarConfigFiscal } from '@/app/actions/configuracion'
import { ConfigFiscal } from '@/types/facturacion.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Save } from 'lucide-react'

export function ConfigFiscalForm({ configInicial }: { configInicial: ConfigFiscal | null }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [formData, setFormData] = useState({
    alicuota_iva_general: configInicial?.alicuota_iva_general ?? 16.00,
    alicuota_iva_adicional: configInicial?.alicuota_iva_adicional ?? 15.00,
    alicuota_iva_reducida: configInicial?.alicuota_iva_reducida ?? 8.00,
    alicuota_igtf: configInicial?.alicuota_igtf ?? 3.00,
    proximo_numero_control: configInicial?.proximo_numero_control ?? 1,
    prefijo_control: configInicial?.prefijo_control ?? '00-',
    pie_pagina_1: configInicial?.pie_pagina_1 ?? '',
    pie_pagina_2: configInicial?.pie_pagina_2 ?? '',
    mensaje_retenciones: configInicial?.mensaje_retenciones ?? 'Sujeto a retención de IVA según normativa SENIAT vigente.'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await guardarConfigFiscal(formData)
    setLoading(false)

    if (res.success) {
      router.refresh()
    } else {
      setError(res.error || 'Ocurrió un error al guardar')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <p>{error}</p>
        </div>
      )}
      
      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary">Alícuotas de Impuestos (SENIAT)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Configure los porcentajes actuales aplicables por ley.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-2 max-w-xs">
            <Label htmlFor="alicuota_iva_general" className="text-[13px] text-muted-foreground ml-1">IVA General (%)</Label>
            <Input id="alicuota_iva_general" name="alicuota_iva_general" type="number" step="0.01" value={formData.alicuota_iva_general} onChange={handleChange} required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary">Control de Facturación</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Configure la secuencia de facturas o Formatos Libres.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prefijo_control" className="text-[13px] text-muted-foreground ml-1">Prefijo Número de Control</Label>
            <Input id="prefijo_control" name="prefijo_control" value={formData.prefijo_control} onChange={handleChange} placeholder="Ej: 00-" required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="proximo_numero_control" className="text-[13px] text-muted-foreground ml-1">Próximo Número</Label>
            <Input id="proximo_numero_control" name="proximo_numero_control" type="number" value={formData.proximo_numero_control} onChange={handleChange} required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors" />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary">Impresión de Factura</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Textos a mostrar al final de los comprobantes impresos.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mensaje_retenciones" className="text-[13px] text-muted-foreground ml-1">Mensaje Fiscal (Retenciones)</Label>
            <Input id="mensaje_retenciones" name="mensaje_retenciones" value={formData.mensaje_retenciones} onChange={handleChange} className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pie_pagina_1" className="text-[13px] text-muted-foreground ml-1">Pie de Página 1 (Lema, Gracias por su compra, etc)</Label>
              <Input id="pie_pagina_1" name="pie_pagina_1" value={formData.pie_pagina_1} onChange={handleChange} className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pie_pagina_2" className="text-[13px] text-muted-foreground ml-1">Pie de Página 2</Label>
              <Input id="pie_pagina_2" name="pie_pagina_2" value={formData.pie_pagina_2} onChange={handleChange} className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-2">
        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,176,39,0.3)] h-11 px-8 transition-all">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </form>
  )
}
