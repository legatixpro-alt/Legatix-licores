import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import FinanzasClient from '@/components/finanzas/FinanzasClient'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.rol !== 'admin') redirect('/dashboard')

  const supabase = createClient()

  // Todas las queries en paralelo
  const [cxcRes, proveedoresRes, comprasRes] = await Promise.all([
    supabase
      .from('facturas')
      .select(`
        *,
        cliente:clientes(id, razon_social, numero_doc, telefono),
        pagos:facturas_pagos(moneda, monto)
      `)
      .eq('empresa_id', user.empresa_id)
      .eq('tipo_documento', 'FACTURA')
      .eq('condicion_pago', 'CREDITO')
      .neq('estatus', 'ANULADA')
      .order('fecha_emision', { ascending: false }),
    supabase
      .from('proveedores')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .order('razon_social', { ascending: true }),
    supabase
      .from('facturas_compras')
      .select(`
        *,
        proveedor:proveedores(id, razon_social, rif),
        pagos:compras_pagos(moneda, monto)
      `)
      .eq('empresa_id', user.empresa_id)
      .order('fecha_emision', { ascending: false }),
  ])

  return (
    <div className="h-full w-full">
      <FinanzasClient
        cxcFacturas={cxcRes.data || []}
        proveedores={proveedoresRes.data || []}
        compras={comprasRes.data || []}
        empresaId={user.empresa_id}
        userId={user.id}
      />
    </div>
  )
}
