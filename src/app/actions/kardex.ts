'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { TipoMovimientoKardex } from '@/types/inventario.types'

export async function registrarMovimientoKardex(data: {
  producto_id: string
  tipo: TipoMovimientoKardex
  cantidad: number
  motivo: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()
    
  if (!usuario) return { success: false, error: 'Usuario no encontrado' }
  
  // stock_anterior y stock_nuevo serán sobreescritos por el trigger de base de datos
  const { error } = await supabase.from('kardex').insert({
    empresa_id: usuario.empresa_id,
    producto_id: data.producto_id,
    usuario_id: user.id,
    tipo: data.tipo,
    cantidad: data.cantidad,
    motivo: data.motivo,
    stock_anterior: 0, 
    stock_nuevo: 0 
  })

  if (error) return { success: false, error: error.message }
  
  revalidatePath('/inventario')
  return { success: true }
}
