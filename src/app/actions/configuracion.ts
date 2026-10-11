'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function guardarConfigFiscal(data: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'admin') {
    return { success: false, error: 'Solo el administrador puede configurar los datos fiscales' }
  }

  // Verificar si ya existe
  const { data: existente } = await supabase
    .from('config_fiscal')
    .select('id')
    .eq('empresa_id', usuario.empresa_id)
    .single()

  if (existente) {
    const { error } = await supabase
      .from('config_fiscal')
      .update(data)
      .eq('id', existente.id)
    if (error) return { success: false, error: error.message }
  } else {
    const { error } = await supabase
      .from('config_fiscal')
      .insert({ ...data, empresa_id: usuario.empresa_id })
    if (error) return { success: false, error: error.message }
  }

  revalidatePath('/configuracion')
  return { success: true }
}

export async function guardarDatosEmpresa(data: {
  razon_social: string
  nombre_comercial?: string
  rif: string
  direccion_fiscal: string
  telefono?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'No autorizado' }

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('empresa_id, rol')
    .eq('id', user.id)
    .single()

  if (!usuario || usuario.rol !== 'admin') {
    return { success: false, error: 'Solo el administrador puede configurar los datos de la empresa' }
  }

  const { error } = await supabase
    .from('empresas')
    .update({
      razon_social: data.razon_social,
      nombre_comercial: data.nombre_comercial,
      rif: data.rif,
      direccion_fiscal: data.direccion_fiscal,
      telefono: data.telefono
    })
    .eq('id', usuario.empresa_id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/configuracion')
  revalidatePath('/facturacion')
  return { success: true }
}
