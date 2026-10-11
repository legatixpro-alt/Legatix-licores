'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { guardarConfigFiscal, guardarDatosEmpresa } from '@/app/actions/configuracion'
import { ConfigFiscal } from '@/types/facturacion.types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Save, Building2 } from 'lucide-react'

interface EmpresaProps {
  id?: string
  rif?: string
  razon_social?: string
  nombre_comercial?: string
  direccion_fiscal?: string
  telefono?: string
}

export function ConfigFiscalForm({ 
  configInicial, 
  empresaInicial 
}: { 
  configInicial: ConfigFiscal | null
  empresaInicial?: EmpresaProps | null 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()

  const [empresaData, setEmpresaData] = useState({
    razon_social: empresaInicial?.razon_social ?? 'INVERSIONES SAN JOSE 2026, C.A',
    nombre_comercial: empresaInicial?.nombre_comercial ?? 'LICORERÍA LEGATIX',
    rif: empresaInicial?.rif ?? 'J-50829833-0',
    direccion_fiscal: empresaInicial?.direccion_fiscal ?? 'AV 19D CON CALLE 96B LOCAL NRO S/N BARRIO SAN JOSE, MARACAIBO ZULIA ZONA POSTAL 4002',
    telefono: empresaInicial?.telefono ?? ''
  })

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
    setSuccessMsg(null)

    const [resConfig, resEmpresa] = await Promise.all([
      guardarConfigFiscal(formData),
      guardarDatosEmpresa(empresaData)
    ])

    setLoading(false)

    if (resConfig.success && resEmpresa.success) {
      setSuccessMsg('Configuración guardada y actualizada exitosamente.')
      router.refresh()
    } else {
      setError(resEmpresa.error || resConfig.error || 'Ocurrió un error al guardar')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
          <p>{successMsg}</p>
        </div>
      )}
      
      {/* ── Datos Fiscales de la Empresa ─────────────────── */}
      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-primary">Datos Fiscales de la Empresa (Encabezado)</CardTitle>
          </div>
          <CardDescription className="text-xs text-muted-foreground">Esta información se imprimirá en el encabezado de todas las notas de entrega y facturas.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="razon_social" className="text-[13px] text-muted-foreground ml-1">Razón Social</Label>
            <Input 
              id="razon_social" 
              name="razon_social" 
              value={empresaData.razon_social} 
              onChange={e => setEmpresaData(p => ({ ...p, razon_social: e.target.value }))} 
              required 
              className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors font-medium" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="rif" className="text-[13px] text-muted-foreground ml-1">RIF de la Empresa</Label>
            <Input 
              id="rif" 
              name="rif" 
              value={empresaData.rif} 
              onChange={e => setEmpresaData(p => ({ ...p, rif: e.target.value }))} 
              required 
              className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors font-medium" 
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="direccion_fiscal" className="text-[13px] text-muted-foreground ml-1">Dirección Fiscal Completa</Label>
            <Input 
              id="direccion_fiscal" 
              name="direccion_fiscal" 
              value={empresaData.direccion_fiscal} 
              onChange={e => setEmpresaData(p => ({ ...p, direccion_fiscal: e.target.value }))} 
              required 
              className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors font-medium" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="nombre_comercial" className="text-[13px] text-muted-foreground ml-1">Nombre Comercial (Opcional)</Label>
            <Input 
              id="nombre_comercial" 
              name="nombre_comercial" 
              value={empresaData.nombre_comercial} 
              onChange={e => setEmpresaData(p => ({ ...p, nombre_comercial: e.target.value }))} 
              className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="telefono" className="text-[13px] text-muted-foreground ml-1">Teléfono de Contacto</Label>
            <Input 
              id="telefono" 
              name="telefono" 
              value={empresaData.telefono} 
              onChange={e => setEmpresaData(p => ({ ...p, telefono: e.target.value }))} 
              className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" 
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Alícuotas de Impuestos (SENIAT) ─────────────── */}
      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary">Alícuotas de Impuestos (SENIAT)</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Configure los porcentajes actuales aplicables por ley.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="alicuota_iva_general" className="text-[13px] text-muted-foreground ml-1">IVA General (%)</Label>
            <Input id="alicuota_iva_general" name="alicuota_iva_general" type="number" step="0.01" value={formData.alicuota_iva_general} onChange={handleChange} required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="alicuota_iva_adicional" className="text-[13px] text-muted-foreground ml-1">Alícuota Adicional Licores (%)</Label>
            <Input id="alicuota_iva_adicional" name="alicuota_iva_adicional" type="number" step="0.01" value={formData.alicuota_iva_adicional} onChange={handleChange} required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
          </div>
        </CardContent>
      </Card>

      {/* ── Control de Facturación ───────────────────────── */}
      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary">Control de Facturación</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Configure la secuencia de comprobantes de control.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="prefijo_control" className="text-[13px] text-muted-foreground ml-1">Prefijo Número de Control</Label>
            <Input id="prefijo_control" name="prefijo_control" value={formData.prefijo_control} onChange={handleChange} placeholder="Ej: 00-" required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="proximo_numero_control" className="text-[13px] text-muted-foreground ml-1">Próximo Número</Label>
            <Input id="proximo_numero_control" name="proximo_numero_control" type="number" value={formData.proximo_numero_control} onChange={handleChange} required className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
          </div>
        </CardContent>
      </Card>

      {/* ── Impresión de Factura ─────────────────────────── */}
      <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
        <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold text-primary">Pie de Página de Tickets y Facturas</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Textos a mostrar al final de los comprobantes impresos.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="mensaje_retenciones" className="text-[13px] text-muted-foreground ml-1">Mensaje Fiscal (Retenciones)</Label>
            <Input id="mensaje_retenciones" name="mensaje_retenciones" value={formData.mensaje_retenciones} onChange={handleChange} className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="pie_pagina_1" className="text-[13px] text-muted-foreground ml-1">Pie de Página 1 (Lema, Gracias por su compra, etc)</Label>
              <Input id="pie_pagina_1" name="pie_pagina_1" value={formData.pie_pagina_1} onChange={handleChange} className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pie_pagina_2" className="text-[13px] text-muted-foreground ml-1">Pie de Página 2</Label>
              <Input id="pie_pagina_2" name="pie_pagina_2" value={formData.pie_pagina_2} onChange={handleChange} className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end mt-2">
        <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,176,39,0.3)] h-11 px-8 transition-all font-bold">
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : 'Guardar Toda la Configuración'}
        </Button>
      </div>
    </form>
  )
}
