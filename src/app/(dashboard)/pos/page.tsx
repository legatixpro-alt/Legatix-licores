import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { POSClient } from '@/components/pos/POSClient'
import type { Cliente, ConfigFiscal } from '@/types/facturacion.types'
import type { Producto, Categoria } from '@/types/inventario.types'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Punto de Venta — Legatix POS',
}

export default async function POSPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  // Todas las queries en paralelo
  const [{ data: clientes }, { data: productos }, { data: configFiscal }, { data: categorias }] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .eq('activo', true)
      .order('razon_social'),
    supabase
      .from('productos')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .eq('activo', true)
      .gt('stock_actual', 0)
      .order('nombre'),
    supabase
      .from('config_fiscal')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .single(),
    supabase
      .from('categorias')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .eq('activo', true)
      .order('nombre'),
  ])

  if (!configFiscal) {
    return (
      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-6 max-w-2xl">
        <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <h2 className="text-lg font-bold text-amber-900">Configuración Fiscal Requerida</h2>
          <p className="mt-2 text-sm text-amber-800">
            Antes de utilizar el Punto de Venta, debe configurar los datos fiscales de la empresa.
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
    <div className="flex flex-col h-[calc(100vh-6rem)] -m-6 p-4">
      <POSClient
        initialProducts={(productos as Producto[]) || []}
        categorias={(categorias as Categoria[]) || []}
        clientes={(clientes as Cliente[]) || []}
        configFiscal={configFiscal as ConfigFiscal}
        empresaId={user.empresa_id}
        userId={user.id}
      />
    </div>
  )
}
