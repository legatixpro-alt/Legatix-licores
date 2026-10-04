import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { FacturaImprimible } from '@/components/facturacion/FacturaImprimible'
import type { FacturaConRelaciones, ConfigFiscal } from '@/types/facturacion.types'

export default async function ImprimirFacturaPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!usuario) redirect('/login')

  const [{ data: factura }, { data: empresa }, { data: config }] = await Promise.all([
    supabase
      .from('facturas')
      .select(`*, cliente:clientes(*), items:facturas_items(*), pagos:facturas_pagos(*)`)
      .eq('id', params.id)
      .eq('empresa_id', usuario.empresa_id)
      .single(),
    supabase
      .from('empresas')
      .select('*')
      .eq('id', usuario.empresa_id)
      .single(),
    supabase
      .from('config_fiscal')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .single(),
  ])

  if (!factura) notFound()

  return (
    <FacturaImprimible
      factura={factura as unknown as FacturaConRelaciones}
      empresa={empresa}
      config={config as ConfigFiscal}
    />
  )
}
