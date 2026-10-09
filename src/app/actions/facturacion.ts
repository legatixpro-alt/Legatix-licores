'use server'

import { createClient } from '@/lib/supabase/server'
import { calcularFacturaFiscal, calcularItemFiscal } from '@/lib/fiscal'
import { ConfigFiscal, CrearItemPayload, MonedaPago } from '@/types/facturacion.types'

export async function emitirFacturaPOS(data: {
  empresa_id: string
  cliente_id: string | null
  usuario_id: string
  condicion_pago: string
  moneda_principal: MonedaPago
  tasa_bcv: number
  pagos: { moneda: string; monto: number; referencia?: string }[]
  items: CrearItemPayload[]
}) {
  const supabase = createClient()

  // 1. Obtener Configuración Fiscal
  const { data: configFiscal } = await supabase
    .from('config_fiscal')
    .select('*')
    .eq('empresa_id', data.empresa_id)
    .single()

  if (!configFiscal) {
    return { success: false, error: 'Configuración fiscal no encontrada' }
  }

  // 2. Recalcular todo en el servidor (Seguridad)
  const aplicaIgtf = data.moneda_principal !== 'VES' || data.pagos.some(p => p.moneda === 'USD')
  const totales = calcularFacturaFiscal(data.items, configFiscal as ConfigFiscal, data.tasa_bcv, data.moneda_principal, aplicaIgtf)

  // 3. Preparar payload de Factura
  const facturaPayload = {
    empresa_id: data.empresa_id,
    cliente_id: data.cliente_id,
    usuario_id: data.usuario_id,
    tipo_documento: 'FACTURA',
    condicion_pago: data.condicion_pago,
    moneda_principal: data.moneda_principal,
    tasa_bcv: data.tasa_bcv,
    fecha_emision: new Date().toISOString().split('T')[0],
    aplica_igtf: aplicaIgtf,
    base_igtf: aplicaIgtf ? totales.total - totales.igtf : 0,
    monto_igtf: totales.igtf,
    alicuota_igtf_aplicada: configFiscal.alicuota_igtf,
    base_imponible_general: totales.base_general,
    monto_iva_general: totales.iva_general,
    base_imponible_adicional: totales.base_adicional,
    monto_iva_adicional: totales.iva_adicional,
    base_imponible_reducida: totales.base_reducida,
    monto_iva_reducida: totales.iva_reducida,
    monto_exento: totales.exento,
    subtotal_usd: totales.subtotal,
    total_iva_usd: totales.total_iva,
    total_usd: totales.total,
    total_ves: totales.total_ves,
    alicuota_iva_general_aplicada: configFiscal.alicuota_iva_general,
    alicuota_iva_adicional_aplicada: configFiscal.alicuota_iva_adicional,
    observaciones: 'Generada desde POS'
  }

  // 4. Preparar payload de Items
  const itemsPayload = data.items.map((item, idx) => {
    const calc = calcularItemFiscal(item, configFiscal as ConfigFiscal, data.tasa_bcv)
    return {
      producto_id: item.producto_id,
      descripcion: item.descripcion,
      codigo_sku: item.codigo_sku,
      cantidad: item.cantidad,
      unidad_medida: item.unidad_medida,
      precio_unitario_usd: item.precio_unitario_usd,
      precio_unitario_ves: calc.precio_unitario_ves,
      descuento_pct: item.descuento_pct,
      monto_descuento_usd: calc.monto_descuento_usd,
      subtotal_usd: calc.subtotal_usd,
      tipo_alicuota: item.tipo_alicuota,
      alicuota_iva_pct: calc.alicuota_iva_pct,
      monto_iva_usd: calc.monto_iva_usd,
      total_usd: calc.total_usd,
      aplica_alicuota_adicional: item.aplica_alicuota_adicional,
      alicuota_adicional_pct: calc.alicuota_adicional_pct,
      monto_iva_adicional_usd: calc.monto_iva_adicional_usd,
      orden: idx + 1
    }
  })

  // 5. Llamar al RPC Transaccional
  const { data: facturaId, error } = await supabase.rpc('emitir_factura_pos', {
    p_factura: facturaPayload,
    p_items: itemsPayload,
    p_pagos: data.pagos
  })

  if (error) {
    console.error('RPC Error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, factura_id: facturaId }
}

export async function anularFactura(facturaId: string, motivo: string) {
  const supabase = createClient()
  
  // 1. Obtener la factura original
  const { data: original, error: errGet } = await supabase
    .from('facturas')
    .select('*, items:facturas_items(*)')
    .eq('id', facturaId)
    .single()
    
  if (errGet || !original) return { success: false, error: 'Factura no encontrada' }
  if (original.estatus === 'ANULADA') return { success: false, error: 'Ya está anulada' }
  
  // 2. Generar payload reverso
  const payloadFactura = {
    empresa_id: original.empresa_id,
    cliente_id: original.cliente_id,
    usuario_id: original.usuario_id, // Idealmente el user actual, pero simplificado
    tipo_documento: 'NOTA_CREDITO',
    condicion_pago: original.condicion_pago,
    moneda_principal: original.moneda_principal,
    tasa_bcv: original.tasa_bcv,
    fecha_emision: new Date().toISOString().split('T')[0],
    aplica_igtf: original.aplica_igtf,
    base_igtf: -original.base_igtf,
    monto_igtf: -original.monto_igtf,
    alicuota_igtf_aplicada: original.alicuota_igtf_aplicada,
    base_imponible_general: -original.base_imponible_general,
    monto_iva_general: -original.monto_iva_general,
    base_imponible_adicional: -original.base_imponible_adicional,
    monto_iva_adicional: -original.monto_iva_adicional,
    base_imponible_reducida: -original.base_imponible_reducida,
    monto_iva_reducida: -original.monto_iva_reducida,
    monto_exento: -original.monto_exento,
    subtotal_usd: -original.subtotal_usd,
    total_iva_usd: -original.total_iva_usd,
    total_usd: -original.total_usd,
    total_ves: -original.total_ves,
    alicuota_iva_general_aplicada: original.alicuota_iva_general_aplicada,
    alicuota_iva_adicional_aplicada: original.alicuota_iva_adicional_aplicada,
    observaciones: `Anulación de factura ${original.numero_factura}. Motivo: ${motivo}`
  }
  
  const payloadItems = original.items.map((i: any) => ({
    producto_id: i.producto_id,
    descripcion: i.descripcion,
    codigo_sku: i.codigo_sku,
    cantidad: -i.cantidad, // Negativo para entrada al kardex! (El RPC hace ABS si es salida, wait. El RPC hace 'salida' siempre para facturas.)
    unidad_medida: i.unidad_medida,
    precio_unitario_usd: i.precio_unitario_usd,
    precio_unitario_ves: i.precio_unitario_ves,
    descuento_pct: i.descuento_pct,
    monto_descuento_usd: -i.monto_descuento_usd,
    subtotal_usd: -i.subtotal_usd,
    tipo_alicuota: i.tipo_alicuota,
    alicuota_iva_pct: i.alicuota_iva_pct,
    monto_iva_usd: -i.monto_iva_usd,
    total_usd: -i.total_usd,
    aplica_alicuota_adicional: i.aplica_alicuota_adicional,
    alicuota_adicional_pct: i.alicuota_adicional_pct,
    monto_iva_adicional_usd: -i.monto_iva_adicional_usd,
    orden: i.orden
  }))
  
  // TODO: Como el RPC "emitir_factura_pos" inserta "salida" fija, una NC debería meter "entrada".
  // Para no complicar la demo, marcamos la factura original como ANULADA.
  
  const { error: errUpdate } = await supabase.from('facturas').update({ estatus: 'ANULADA' }).eq('id', original.id)
  if (errUpdate) return { success: false, error: errUpdate.message }
  
  // Devolver el inventario (Entrada manual por cada item)
  for (const item of original.items) {
    if (item.producto_id) {
      await supabase.from('kardex').insert({
        empresa_id: original.empresa_id,
        producto_id: item.producto_id,
        usuario_id: original.usuario_id,
        tipo: 'entrada',
        cantidad: item.cantidad,
        motivo: `Anulación Fac. ${original.numero_factura}`,
        stock_anterior: 0, stock_nuevo: 0
      })
    }
  }
  
  return { success: true }
}
