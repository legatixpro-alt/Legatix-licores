import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { UsuariosClient } from '@/components/usuarios/UsuariosClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Usuarios — Legatix POS',
  description: 'Gestión de usuarios y roles',
}

export default async function UsuariosPage() {
  const user = await getCurrentUser()
  if (!user || user.rol !== 'admin') redirect('/dashboard')

  const supabase = createClient()

  const { data: usuarios } = await supabase
    .from('usuarios')
    .select('*')
    .eq('empresa_id', user.empresa_id)
    .order('created_at', { ascending: true })

  return (
    <UsuariosClient
      usuarios={usuarios || []}
      empresaId={user.empresa_id}
    />
  )
}
