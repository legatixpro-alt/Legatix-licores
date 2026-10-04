import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { ClientesClient } from '@/components/facturacion/ClientesClient'
import type { Cliente } from '@/types/facturacion.types'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Clientes — Legatix POS',
  description: 'Gestión de clientes y adquirentes para facturación SENIAT',
}

export default async function ClientesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', user.empresa_id)
    .eq('activo', true)
    .order('razon_social')

  return (
    <ClientesClient
      clientes={(clientes as Cliente[]) ?? []}
      empresaId={user.empresa_id}
    />
  )
}
