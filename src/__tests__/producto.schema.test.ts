import { describe, it, expect } from 'vitest'
import { productoSchema } from '../lib/validations/producto.schema'

describe('Producto Schema Validation', () => {
  const baseValidProduct = {
    codigo_sku: 'PRD-001',
    nombre: 'Vino Tinto Reserva',
    unidad_medida: 'BOTELLA',
    precio_costo: 10,
    precio_venta: 15,
    precio_venta_usd: 15,
    stock_actual: 100,
    stock_minimo: 10,
    es_licor: false,
    gravado_iva: true,
    alicuota_iva: 16,
    activo: true,
  }

  it('debería validar un producto estándar correctamente', () => {
    const result = productoSchema.safeParse(baseValidProduct)
    expect(result.success).toBe(true)
  })

  it('debería rechazar un producto estándar si el precio es negativo', () => {
    const result = productoSchema.safeParse({
      ...baseValidProduct,
      precio_costo: -5
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('precio_costo')
    }
  })

  it('debería fallar si es_licor es true pero faltan volumen o grado alcohólico', () => {
    const result = productoSchema.safeParse({
      ...baseValidProduct,
      es_licor: true,
      volumen_litros: 0,
      grado_alcoholico: 0
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path[0])
      expect(paths).toContain('volumen_litros')
      expect(paths).toContain('grado_alcoholico')
    }
  })

  it('debería validar correctamente un licor con volumen y grado alcohólico correctos', () => {
    const result = productoSchema.safeParse({
      ...baseValidProduct,
      es_licor: true,
      volumen_litros: 0.75,
      grado_alcoholico: 12.5
    })
    
    expect(result.success).toBe(true)
  })
})
