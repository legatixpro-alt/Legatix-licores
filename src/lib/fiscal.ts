// ─────────────────────────────────────────────────────────────
// MOTOR DE CÁLCULO FISCAL VENEZOLANO
// Normativa: LIVA + Providencia SENIAT 00071/2011
//
// IMPORTANTE: Las alícuotas NUNCA son hardcodeadas.
// Siempre se reciben desde ConfigFiscal (base de datos).
// ─────────────────────────────────────────────────────────────

import type {
  ConfigFiscal,
  CalculoFiscal,
  CrearItemPayload,
  MonedaPago,
} from '@/types/facturacion.types'

// ─────────────────────────────────────────
// Calcula el impuesto de un ítem individual
// ─────────────────────────────────────────
export function calcularItemFiscal(
  item: CrearItemPayload,
  config: ConfigFiscal,
  tasaBcv: number
): {
  subtotal_usd: number
  monto_descuento_usd: number
  alicuota_iva_pct: number
  monto_iva_usd: number
  alicuota_adicional_pct: number
  monto_iva_adicional_usd: number
  total_usd: number
  precio_unitario_ves: number
} {
  const precio = item.precio_unitario_usd
  const cantidad = item.cantidad
  const descPct = item.descuento_pct ?? 0

  const bruto = redondear(precio * cantidad)
  const descuento = redondear(bruto * (descPct / 100))
  const subtotal = redondear(bruto - descuento)

  // Seleccionar alícuota IVA general (única usada ahora: 16%)
  const alicuota_iva_pct = item.tipo_alicuota !== 'EXENTO' ? config.alicuota_iva_general : 0;

  const monto_iva_usd = item.tipo_alicuota !== 'EXENTO'
    ? redondear(subtotal * (alicuota_iva_pct / 100))
    : 0

  // Alícuota adicional (Eliminada del sistema)
  const alicuota_adicional_pct = 0
  const monto_iva_adicional_usd = 0

  const total_usd = redondear(subtotal + monto_iva_usd + monto_iva_adicional_usd)
  const precio_unitario_ves = redondear(precio * tasaBcv)

  return {
    subtotal_usd: subtotal,
    monto_descuento_usd: descuento,
    alicuota_iva_pct,
    monto_iva_usd,
    alicuota_adicional_pct,
    monto_iva_adicional_usd,
    total_usd,
    precio_unitario_ves,
  }
}

// ─────────────────────────────────────────
// Calcula el total fiscal de toda la factura
// ─────────────────────────────────────────
export function calcularFacturaFiscal(
  items: CrearItemPayload[],
  config: ConfigFiscal,
  tasaBcv: number,
  monedaPrincipal: MonedaPago,
  aplicarIgtf: boolean
): CalculoFiscal {
  let base_general    = 0
  let iva_general     = 0
  let base_adicional  = 0
  let iva_adicional   = 0
  let base_reducida   = 0
  let iva_reducida    = 0
  let exento          = 0

  for (const item of items) {
    const calc = calcularItemFiscal(item, config, tasaBcv)

    if (item.tipo_alicuota === 'EXENTO') {
      exento = redondear(exento + calc.subtotal_usd)
    } else {
      // SOLO GENERAL
      base_general = redondear(base_general + calc.subtotal_usd)
      iva_general  = redondear(iva_general  + calc.monto_iva_usd)
    }
  }

  const subtotal   = redondear(base_general + base_reducida + exento)
  const total_iva  = redondear(iva_general + iva_reducida + iva_adicional)

  // IGTF: Eliminado del sistema
  const base_igtf  = 0
  const igtf       = 0

  const total      = redondear(subtotal + total_iva + igtf)
  const total_ves  = redondear(total * tasaBcv)

  return {
    subtotal,
    base_general,
    iva_general,
    base_adicional,
    iva_adicional,
    base_reducida,
    iva_reducida,
    exento,
    total_iva,
    igtf,
    total,
    total_ves,
  }
}

// ─────────────────────────────────────────
// Helpers de formato
// ─────────────────────────────────────────
export function redondear(valor: number, decimales = 2): number {
  return Math.round(valor * Math.pow(10, decimales)) / Math.pow(10, decimales)
}

export function formatUSD(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor)
}

export function formatVES(valor: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor) + ' Bs.'
}

export function formatPct(valor: number): string {
  return `${valor.toFixed(2)}%`
}

// ─────────────────────────────────────────
// Genera el número de control formateado
// ─────────────────────────────────────────
export function formatNumeroControl(prefijo: string, numero: number): string {
  return `${prefijo}${String(numero).padStart(7, '0')}`
}

export function formatNumeroFactura(numero: number): string {
  return String(numero).padStart(8, '0')
}

// ─────────────────────────────────────────
// Etiqueta de moneda para la UI
// ─────────────────────────────────────────
export const MONEDA_LABELS: Record<string, string> = {
  USD:  'Dólar Americano (USD)',
  VES:  'Bolívar Digital (Bs.)',
  EUR:  'Euro (EUR)',
  COP:  'Peso Colombiano (COP)',
  USDT: 'USDT / Criptoactivo',
  MIXTO: 'Pago Mixto',
}

export const MONEDA_SIMBOLO: Record<string, string> = {
  USD:  '$',
  VES:  'Bs.',
  EUR:  '€',
  COP:  'COP$',
  USDT: 'USDT',
  MIXTO: '$',
}

// Monedas que activan el IGTF (son divisas / criptoactivos)
export const MONEDAS_IGTF = new Set(['USD', 'EUR', 'COP', 'USDT'])

export function monedaActivaIgtf(moneda: string): boolean {
  return MONEDAS_IGTF.has(moneda)
}
