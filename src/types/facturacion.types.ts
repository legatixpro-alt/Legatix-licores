// ─────────────────────────────────────────────────────────────
// TIPOS TYPESCRIPT — MÓDULO DE FACTURACIÓN
// Normativa SENIAT — Providencia 00071/2011
// ─────────────────────────────────────────────────────────────

export type TipoDocumento   = 'FACTURA' | 'NOTA_CREDITO' | 'NOTA_DEBITO'
export type CondicionPago   = 'CONTADO' | 'CREDITO'
export type MonedaPago      = 'USD' | 'VES' | 'EUR' | 'COP' | 'USDT' | 'MIXTO'
export type EstatusFactura  = 'BORRADOR' | 'EMITIDA' | 'ANULADA' | 'PAGADA'
export type TipoAlicuota    = 'GENERAL' | 'ADICIONAL' | 'REDUCIDA' | 'EXENTO'
export type TipoDoc         = 'RIF' | 'CI' | 'PASS' | 'NIT' | 'OTRO'

// ─────────────────────────────────────────
// Configuración Fiscal (por empresa)
// ─────────────────────────────────────────
export interface ConfigFiscal {
  id:                     string
  empresa_id:             string
  // Alícuotas IVA — siempre configurables, nunca hardcodeadas
  alicuota_iva_general:   number   // Actualmente 16%
  alicuota_iva_adicional: number   // Actualmente 15% (bebidas alcohólicas)
  alicuota_iva_reducida:  number   // Actualmente 8%
  // IGTF
  alicuota_igtf:          number   // Actualmente 3%
  // Numeración
  proximo_numero_control: number
  prefijo_control:        string   // Ej: "00-"
  // Pie de página de la factura
  pie_pagina_1:           string | null
  pie_pagina_2:           string | null
  mensaje_retenciones:    string | null
  updated_at:             string
}

// ─────────────────────────────────────────
// Cliente (Adquirente)
// ─────────────────────────────────────────
export interface Cliente {
  id:                        string
  empresa_id:                string
  tipo_doc:                  TipoDoc
  numero_doc:                string   // RIF / Cédula
  razon_social:              string
  nombre_comercial:          string | null
  direccion_fiscal:          string | null
  telefono:                  string | null
  email:                     string | null
  es_contribuyente_especial: boolean
  activo:                    boolean
  created_at:                string
  updated_at:                string
}

// ─────────────────────────────────────────
// Ítem de Factura
// ─────────────────────────────────────────
export interface FacturaItem {
  id:                       string
  factura_id:               string
  producto_id:              string | null
  descripcion:              string
  codigo_sku:               string | null
  cantidad:                 number
  unidad_medida:            string
  precio_unitario_usd:      number
  precio_unitario_ves:      number
  descuento_pct:            number
  monto_descuento_usd:      number
  subtotal_usd:             number   // Base imponible de esta línea (sin IVA)
  tipo_alicuota:            TipoAlicuota
  alicuota_iva_pct:         number
  monto_iva_usd:            number
  total_usd:                number   // subtotal + IVA general + IVA adicional
  aplica_alicuota_adicional: boolean  // true para licores
  alicuota_adicional_pct:   number
  monto_iva_adicional_usd:  number
  orden:                    number
  created_at:               string
}

// ─────────────────────────────────────────
// Pago de Factura
// ─────────────────────────────────────────
export interface FacturaPago {
  id:         string
  factura_id: string
  moneda:     MonedaPago
  monto:      number
  referencia: string | null
  created_at: string
}

// ─────────────────────────────────────────
// Factura (documento fiscal principal)
// ─────────────────────────────────────────
export interface Factura {
  id:            string
  empresa_id:    string
  cliente_id:    string
  usuario_id:    string

  // Identificación
  tipo_documento:        TipoDocumento
  numero_control:        string   // Ej: "00-0000001"
  numero_factura:        string   // Ej: "00000001"

  // Referencia NC/ND
  factura_referencia_id: string | null
  numero_factura_ref:    string | null
  fecha_factura_ref:     string | null
  motivo_nota:           string | null

  // Fechas
  fecha_emision:         string
  fecha_vencimiento:     string | null

  // Condiciones
  condicion_pago:        CondicionPago
  moneda_principal:      MonedaPago
  tasa_bcv:              number

  // Bases imponibles e IVA
  base_imponible_general:   number
  monto_iva_general:        number
  base_imponible_adicional: number
  monto_iva_adicional:      number
  base_imponible_reducida:  number
  monto_iva_reducida:       number
  monto_exento:             number

  // IGTF
  aplica_igtf:           boolean
  base_igtf:             number
  monto_igtf:            number
  alicuota_igtf_aplicada: number

  // Totales
  subtotal_usd:          number
  total_iva_usd:         number
  total_usd:             number
  total_ves:             number

  // Snapshot de alícuotas al momento de emisión
  alicuota_iva_general_aplicada:   number
  alicuota_iva_adicional_aplicada: number

  // Estado
  estatus:               EstatusFactura
  observaciones:         string | null
  created_at:            string
  updated_at:            string

  // Relaciones expandidas (joins)
  cliente?:              Cliente
  items?:                FacturaItem[]
  pagos?:                FacturaPago[]
}

// ─────────────────────────────────────────
// Factura con relaciones (para UI)
// ─────────────────────────────────────────
export interface FacturaConRelaciones extends Factura {
  cliente:  Cliente
  items:    FacturaItem[]
  pagos:    FacturaPago[]
}

// ─────────────────────────────────────────
// Registro del Libro de Ventas
// ─────────────────────────────────────────
export interface LibroVentasRow {
  empresa_id:              string
  fecha_emision:           string
  numero_factura:          string
  numero_control:          string
  tipo_documento:          TipoDocumento
  tipo_doc_cliente:        TipoDoc
  rif_cliente:             string
  nombre_cliente:          string
  monto_exento:            number
  base_imponible_reducida: number
  monto_iva_reducida:      number
  base_imponible_general:  number
  monto_iva_general:       number
  base_imponible_adicional: number
  monto_iva_adicional:     number
  total_iva:               number
  aplica_igtf:             boolean
  monto_igtf:              number
  total_usd:               number
  tasa_bcv:                number
  total_ves:               number
  estatus:                 EstatusFactura
}

// ─────────────────────────────────────────
// Objeto de cálculo fiscal (motor de impuestos)
// ─────────────────────────────────────────
export interface CalculoFiscal {
  subtotal:                 number   // sin IVA
  base_general:             number   // base para IVA 16%
  iva_general:              number
  base_adicional:           number   // base para IVA adicional (licores)
  iva_adicional:            number
  base_reducida:            number
  iva_reducida:             number
  exento:                   number
  total_iva:                number
  igtf:                     number
  total:                    number   // subtotal + total_iva + igtf
  total_ves:                number
}

// ─────────────────────────────────────────
// Payload para crear una factura nueva
// ─────────────────────────────────────────
export interface CrearFacturaPayload {
  cliente_id:        string
  tipo_documento:    TipoDocumento
  condicion_pago:    CondicionPago
  moneda_principal:  MonedaPago
  tasa_bcv:          number
  aplica_igtf:       boolean
  observaciones?:    string
  items:             CrearItemPayload[]
  pagos:             CrearPagoPayload[]
  // NC/ND
  factura_referencia_id?: string
  numero_factura_ref?:    string
  fecha_factura_ref?:     string
  motivo_nota?:           string
}

export interface CrearItemPayload {
  producto_id?:             string
  descripcion:              string
  codigo_sku?:              string
  cantidad:                 number
  unidad_medida:            string
  precio_unitario_usd:      number
  descuento_pct:            number
  tipo_alicuota:            TipoAlicuota
  aplica_alicuota_adicional: boolean  // true = licor
}

export interface CrearPagoPayload {
  moneda:     MonedaPago
  monto:      number
  referencia?: string
}
