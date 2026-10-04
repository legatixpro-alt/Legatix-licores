export interface Producto {
  id: string
  empresa_id: string
  categoria_id: string | null
  proveedor_id: string | null
  codigo_sku: string
  nombre: string
  descripcion: string | null
  unidad_medida: string
  precio_costo: number
  precio_venta: number
  precio_venta_usd: number
  stock_actual: number
  stock_minimo: number
  volumen_litros: number | null
  es_licor: boolean
  es_promo: boolean
  grado_alcoholico: number | null
  gravado_iva: boolean
  alicuota_iva: number
  activo: boolean
  created_at: string
  updated_at: string
}

export type TipoMovimientoKardex = 'entrada' | 'salida' | 'ajuste' | 'merma'

export interface Kardex {
  id: string
  empresa_id: string
  producto_id: string
  usuario_id: string
  tipo: TipoMovimientoKardex
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string | null
  documento_referencia: string | null
  created_at: string
}

export interface Categoria {
  id: string
  empresa_id: string
  nombre: string
  descripcion: string | null
  activo: boolean
}

export interface Proveedor {
  id: string
  empresa_id: string
  rif: string
  razon_social: string
  contacto: string | null
  telefono: string | null
  direccion: string | null
  activo: boolean
}
