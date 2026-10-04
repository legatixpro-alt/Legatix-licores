import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { FacturasClient } from '@/components/facturacion/FacturasClient'
import type { Factura, Cliente } from '@/types/facturacion.types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Facturación — Legatix POS',
  description: 'Gestión de facturas, notas de crédito y débito conforme normativa SENIAT',
}

export default async function FacturacionPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  const inicioMes = new Date()
  inicioMes.setDate(1)
  inicioMes.setHours(0, 0, 0, 0)
  const inicioMesStr = inicioMes.toISOString().split('T')[0]

  // Todas las queries en paralelo con Promise.all
  const [facturasRes, clientesRes, configFiscalRes, empresasRes] = await Promise.all([
    supabase
      .from('facturas')
      .select(`
        *,
        cliente:clientes(id, tipo_doc, numero_doc, razon_social)
      `)
      .eq('empresa_id', user.empresa_id)
      .gte('fecha_emision', inicioMesStr)
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .eq('activo', true)
      .order('razon_social'),
    supabase
      .from('config_fiscal')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .single(),
    supabase
      .from('empresas')
      .select('*')
      .eq('id', user.empresa_id)
      .single(),
  ])

  return (
    <FacturasClient
      facturas={(facturasRes.data as unknown as Factura[]) ?? []}
      clientes={(clientesRes.data as Cliente[]) ?? []}
      configFiscal={configFiscalRes.data}
      empresaId={user.empresa_id}
      empresa={empresasRes.data}
    />
  )
}
