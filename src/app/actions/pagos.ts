'use server'

import { createClient } from '@/lib/supabase/server'

export async function registrarPago(payload: {
  factura_id: string
  moneda: string
  monto: number
  referencia?: string
  tasa_bcv_dia?: number
}) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('facturas_pagos')
      .insert({
        factura_id: payload.factura_id,
        moneda: payload.moneda,
        monto: payload.monto,
        referencia: payload.referencia || null
      })
      .select()
      .single()
      
    if (error) {
      console.error('Error insertando pago:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, pago: data }
  } catch (error: any) {
    console.error('Exception registrando pago:', error)
    return { success: false, error: error.message }
  }
}
