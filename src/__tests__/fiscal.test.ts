import { describe, it, expect } from 'vitest'
import { calcularFacturaFiscal, calcularItemFiscal } from '../lib/fiscal'
import type { ConfigFiscal, CrearItemPayload } from '../types/facturacion.types'

describe('Motor de Cálculo Fiscal SENIAT', () => {
  const configBase: ConfigFiscal = {
    id: '1',
    empresa_id: '1',
    alicuota_iva_general: 16,
    alicuota_iva_adicional: 15,
    alicuota_iva_reducida: 8,
    alicuota_igtf: 3,
    proximo_numero_control: 1,
    prefijo_control: '00-',
    pie_pagina_1: '',
    pie_pagina_2: '',
    mensaje_retenciones: '',
    updated_at: ''
  }

  const tasaBcv = 40.00 // 1 USD = 40 Bs

  it('Calcula un ítem general correctamente', () => {
    const item: CrearItemPayload = {
      descripcion: 'Agua Minalba',
      cantidad: 2,
      unidad_medida: 'UNIDAD',
      precio_unitario_usd: 1.50, // Subtotal 3.00 USD
      descuento_pct: 0,
      tipo_alicuota: 'GENERAL',
      aplica_alicuota_adicional: false
    }

    const calc = calcularItemFiscal(item, configBase, tasaBcv)
    
    expect(calc.subtotal_usd).toBe(3.00)
    expect(calc.monto_iva_usd).toBe(0.48) // 16% de 3.00 = 0.48
    expect(calc.monto_iva_adicional_usd).toBe(0)
    expect(calc.total_usd).toBe(3.48)
    expect(calc.precio_unitario_ves).toBe(60.00) // 1.50 * 40
  })

  it('Calcula un licor (IVA General + IVA Adicional)', () => {
    const item: CrearItemPayload = {
      descripcion: 'Ron Cacique',
      cantidad: 1,
      unidad_medida: 'BOTELLA',
      precio_unitario_usd: 10.00,
      descuento_pct: 0,
      tipo_alicuota: 'GENERAL',
      aplica_alicuota_adicional: true
    }

    const calc = calcularItemFiscal(item, configBase, tasaBcv)
    
    expect(calc.subtotal_usd).toBe(10.00)
    expect(calc.monto_iva_usd).toBe(1.60) // 16% general
    expect(calc.monto_iva_adicional_usd).toBe(1.50) // 15% adicional
    expect(calc.total_usd).toBe(13.10)
  })

  it('Calcula una factura completa pagada en USD (Aplica IGTF)', () => {
    const items: CrearItemPayload[] = [
      {
        descripcion: 'Ron',
        cantidad: 1,
        unidad_medida: 'BOTELLA',
        precio_unitario_usd: 10.00,
        descuento_pct: 0,
        tipo_alicuota: 'GENERAL',
        aplica_alicuota_adicional: true // 10 base + 1.6 IVA + 1.5 IVAA = 13.10
      },
      {
        descripcion: 'Hielo (Exento)',
        cantidad: 1,
        unidad_medida: 'BOLSA',
        precio_unitario_usd: 2.00,
        descuento_pct: 0,
        tipo_alicuota: 'EXENTO',
        aplica_alicuota_adicional: false // 2 base + 0 IVA
      }
    ]

    // Pagando en USD aplica IGTF del 3%
    const calculo = calcularFacturaFiscal(items, configBase, tasaBcv, 'USD', true)

    expect(calculo.subtotal).toBe(12.00) // 10 + 2
    expect(calculo.base_general).toBe(10.00)
    expect(calculo.base_adicional).toBe(10.00)
    expect(calculo.exento).toBe(2.00)
    expect(calculo.iva_general).toBe(1.60)
    expect(calculo.iva_adicional).toBe(1.50)
    expect(calculo.total_iva).toBe(3.10)
    
    // IGTF se calcula sobre (subtotal + IVA) = 12.00 + 3.10 = 15.10
    // 3% de 15.10 = 0.453 -> 0.45
    expect(calculo.igtf).toBe(0.45)
    
    // Total = 15.10 + 0.45 = 15.55
    expect(calculo.total).toBe(15.55)
    expect(calculo.total_ves).toBe(15.55 * 40)
  })

  it('Calcula una factura completa pagada en Bs (No aplica IGTF)', () => {
    const items: CrearItemPayload[] = [
      {
        descripcion: 'Ron',
        cantidad: 1,
        unidad_medida: 'BOTELLA',
        precio_unitario_usd: 10.00,
        descuento_pct: 0,
        tipo_alicuota: 'GENERAL',
        aplica_alicuota_adicional: true // 10 base + 1.6 IVA + 1.5 IVAA = 13.10
      }
    ]

    // Pagando en Bs (VES)
    const calculo = calcularFacturaFiscal(items, configBase, tasaBcv, 'VES', true)

    expect(calculo.subtotal).toBe(10.00)
    expect(calculo.total_iva).toBe(3.10)
    
    // No aplica IGTF porque es VES
    expect(calculo.igtf).toBe(0)
    
    // Total = 13.10
    expect(calculo.total).toBe(13.10)
  })
})
