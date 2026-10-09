export interface Pago {
  id: string
  factura_id: string
  monto: number
  metodo: string
  moneda: string
  fecha_pago: string
}

export interface FacturaCxC {
  id: string
  numero_factura: string
  fecha_emision: string
  total_usd: number
  cliente?: {
    razon_social: string
    numero_doc: string
  }
  pagos: Pago[]
}

export interface Proveedor {
  id: string
  razon_social: string
  rif: string
  contacto?: string
  telefono?: string
  empresa_id: string
}

export interface FacturaCompra {
  id: string
  numero_factura: string
  fecha_emision: string
  total_factura: number
  condicion_pago: string
  moneda: string
  proveedor?: Proveedor
}
