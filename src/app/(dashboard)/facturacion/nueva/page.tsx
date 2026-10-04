import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NuevaFacturaForm } from '@/components/facturacion/NuevaFacturaForm'
import type { Cliente, ConfigFiscal } from '@/types/facturacion.types'
import type { Producto } from '@/types/inventario.types'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: 'Nueva Factura — Legatix POS',
  description: 'Emisión de facturas conforme normativa SENIAT',
}

export default async function NuevaFacturaPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single()

  if (!usuario) redirect('/login')

  const [{ data: clientes }, { data: productos }, { data: configFiscal }] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true)
      .order('razon_social'),
    supabase
      .from('productos')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .eq('activo', true)
      .gt('stock_actual', 0)
      .order('nombre'),
    supabase
      .from('config_fiscal')
      .select('*')
      .eq('empresa_id', usuario.empresa_id)
      .single(),
  ])

  if (!configFiscal) {
    return (
      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-6 max-w-2xl">
        <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-lg font-bold text-amber-900">Configuración Fiscal Requerida</h2>
          <p className="mt-2 text-sm text-amber-800">
            Antes de emitir facturas debe configurar los datos fiscales de la empresa: 
            alícuotas de IVA (general, adicional para licores, IGTF), numeración de control y datos del emisor.
          </p>
          <Link
            href="/configuracion"
            className="mt-4 inline-block rounded-md bg-amber-600 text-white px-4 py-2 text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            Ir a Configuración →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <NuevaFacturaForm
      clientes={(clientes as Cliente[]) ?? []}
      productos={(productos as Producto[]) ?? []}
      configFiscal={configFiscal as ConfigFiscal}
      empresaId={usuario.empresa_id}
      userId={user.id}
    />
  )
}
