import { headers } from 'next/headers'
import { createClient } from './server'
import { cache } from 'react'

/**
 * Helper de performance: obtiene el contexto del usuario actual
 * (user_id, empresa_id, rol) con el MÍNIMO número de round-trips a Supabase.
 *
 * Estrategia:
 * 1. Lee el `user_id` desde el header `x-user-id` inyectado por el middleware.
 *    → Esto ELIMINA la llamada a `supabase.auth.getUser()` en cada página.
 * 2. Realiza una SOLA query a `public.usuarios` para obtener empresa_id y rol.
 * 3. En total: 1 query por navegación (en vez de 2).
 */
export const getCurrentUser = cache(async () => {
  const headersList = headers()
  const userId = headersList.get('x-user-id')
  const userEmail = headersList.get('x-user-email') ?? undefined

  if (!userId) {
    return null
  }

  const supabase = createClient()
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol, nombre_completo')
    .eq('id', userId)
    .single()

  if (!usuario) return null

  return {
    id: userId,
    email: userEmail,
    empresa_id: usuario.empresa_id as string,
    rol: usuario.rol as string,
    nombre_completo: usuario.nombre_completo as string | undefined,
  }
})

/**
 * Obtiene sólo el empresa_id del usuario actual.
 * Útil en páginas que no necesitan el rol.
 */
export async function getEmpresaId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.empresa_id ?? null
}
