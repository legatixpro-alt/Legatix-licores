'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Printer, ArrowLeft, FileMinus, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { FacturaConRelaciones, ConfigFiscal } from '@/types/facturacion.types'
import { formatUSD, formatVES, MONEDA_LABELS } from '@/lib/fiscal'

interface Props {
  factura: FacturaConRelaciones
  empresa: Record<string, string | null | undefined>
  config: ConfigFiscal | null
}

export function FacturaDetalle({ factura, empresa, config }: Props) {
  const router = useRouter()

  const tipoLabel = {
    FACTURA: 'FACTURA',
    NOTA_CREDITO: 'NOTA DE CRÉDITO',
    NOTA_DEBITO: 'NOTA DE DÉBITO',
  }[factura.tipo_documento]

  const estatusStyle = {
    EMITIDA:  'bg-blue-100 text-blue-700',
    PAGADA:   'bg-green-100 text-green-700',
    ANULADA:  'bg-red-100 text-red-700',
    BORRADOR: 'bg-gray-100 text-gray-600',
  }[factura.estatus]

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Barra de acciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {tipoLabel} N° {factura.numero_factura}
            </h2>
            <p className="text-sm text-gray-500">Control: {factura.numero_control}</p>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${estatusStyle}`}>
            {factura.estatus}
          </span>
        </div>
        <div className="flex gap-2">
          {factura.estatus === 'EMITIDA' && (
            <>
              <Link href={`/facturacion/nueva?tipo=NOTA_CREDITO&ref=${factura.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50">
                  <FileMinus className="h-4 w-4" />Nota Crédito
                </Button>
              </Link>
              <Link href={`/facturacion/nueva?tipo=NOTA_DEBITO&ref=${factura.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5 text-orange-700 border-orange-200 hover:bg-orange-50">
                  <FilePlus className="h-4 w-4" />Nota Débito
                </Button>
              </Link>
            </>
          )}
          <Link href={`/facturacion/${factura.id}/imprimir`} target="_blank">
            <Button className="gap-2 bg-gray-900 text-white hover:bg-gray-800">
              <Printer className="h-4 w-4" />Imprimir
            </Button>
          </Link>
        </div>
      </div>

      {/* Documento de factura (preview) */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Cabecera de la factura */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-wide">{empresa?.razon_social ?? 'EMPRESA'}</h3>
              {empresa?.nombre_comercial && <p className="text-gray-600 font-medium">{empresa.nombre_comercial}</p>}
              <p className="text-sm text-gray-500 mt-1">RIF: {empresa?.rif}</p>
              <p className="text-sm text-gray-500">{empresa?.direccion_fiscal}</p>
              {empresa?.telefono && <p className="text-sm text-gray-500">Telf: {empresa.telefono}</p>}
            </div>
            <div className="text-right">
              <div className="inline-block rounded-xl border-2 border-gray-900 px-6 py-3 text-center">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{tipoLabel}</p>
                <p className="text-3xl font-black text-gray-900 mt-1">N° {factura.numero_factura}</p>
                <p className="text-sm font-mono text-gray-600 mt-0.5">Control: {factura.numero_control}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Datos de la operación */}
        <div className="p-6 grid grid-cols-2 gap-6 border-b border-gray-100">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Adquirente</p>
            <p className="font-bold text-gray-900">{factura.cliente.razon_social}</p>
            <p className="text-sm text-gray-600">{factura.cliente.tipo_doc}-{factura.cliente.numero_doc}</p>
            {factura.cliente.direccion_fiscal && <p className="text-sm text-gray-500 mt-1">{factura.cliente.direccion_fiscal}</p>}
            {factura.cliente.es_contribuyente_especial && (
              <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                ⚠ Contribuyente Especial
              </p>
            )}
          </div>
          <div className="text-right space-y-1.5">
            <InfoRow label="Fecha de Emisión" value={factura.fecha_emision} />
            <InfoRow label="Condición" value={factura.condicion_pago} />
            <InfoRow label="Moneda" value={MONEDA_LABELS[factura.moneda_principal] ?? factura.moneda_principal} />
            <InfoRow label="Tasa BCV" value={`Bs. ${Number(factura.tasa_bcv).toFixed(4)}`} />
            {factura.numero_factura_ref && (
              <InfoRow label="Ref. Factura" value={`${factura.numero_factura_ref} (${factura.fecha_factura_ref})`} />
            )}
          </div>
        </div>

        {/* Tabla de ítems */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 font-semibold text-gray-500 text-xs">#</th>
                <th className="text-left py-2 font-semibold text-gray-500 text-xs">DESCRIPCIÓN</th>
                <th className="text-center py-2 font-semibold text-gray-500 text-xs">CANT.</th>
                <th className="text-right py-2 font-semibold text-gray-500 text-xs">P. UNIT.</th>
                <th className="text-right py-2 font-semibold text-gray-500 text-xs">SUBTOTAL</th>
                <th className="text-center py-2 font-semibold text-gray-500 text-xs">ALÍC.</th>
                <th className="text-right py-2 font-semibold text-gray-500 text-xs">IVA</th>
                <th className="text-right py-2 font-semibold text-gray-500 text-xs">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {factura.items.sort((a, b) => a.orden - b.orden).map(item => (
                <tr key={item.id} className="py-2">
                  <td className="py-2.5 text-xs text-gray-400">{item.orden}</td>
                  <td className="py-2.5">
                    <p className="font-medium text-gray-900">{item.descripcion}</p>
                    {item.codigo_sku && <p className="text-xs text-gray-400">{item.codigo_sku}</p>}
                    {item.codigo_sku && <p className="text-xs text-gray-400">{item.codigo_sku}</p>}
                  </td>
                  <td className="py-2.5 text-center text-gray-700">{Number(item.cantidad).toFixed(item.unidad_medida === 'UNIDAD' ? 0 : 3)} {item.unidad_medida}</td>
                  <td className="py-2.5 text-right font-mono text-gray-700">{formatUSD(Number(item.precio_unitario_usd))}</td>
                  <td className="py-2.5 text-right font-mono text-gray-700">{formatUSD(Number(item.subtotal_usd))}</td>
                  <td className="py-2.5 text-center">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      item.tipo_alicuota === 'EXENTO' ? 'bg-gray-100 text-gray-600' :
                      item.tipo_alicuota === 'REDUCIDA' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {item.tipo_alicuota === 'EXENTO' ? 'Exento' : `${item.alicuota_iva_pct}%`}
                    </span>
                  </td>
                  <td className="py-2.5 text-right font-mono text-purple-700">
                    {formatUSD(Number(item.monto_iva_usd) + Number(item.monto_iva_adicional_usd))}
                  </td>
                  <td className="py-2.5 text-right font-mono font-bold text-gray-900">{formatUSD(Number(item.total_usd))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales fiscales */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <TotalRow label={`Base Gravable Gral (${factura.alicuota_iva_general_aplicada}%)`} valor={formatUSD(Number(factura.base_imponible_general))} />

              {Number(factura.monto_exento) > 0 && (
                <TotalRow label="Monto Exento" valor={formatUSD(Number(factura.monto_exento))} />
              )}
              <div className="border-t border-gray-200 pt-2">
                <TotalRow label={`IVA General ${factura.alicuota_iva_general_aplicada}%`} valor={formatUSD(Number(factura.monto_iva_general))} purple />

              </div>

              <div className="border-t-2 border-gray-900 pt-3 mt-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-gray-900">TOTAL A PAGAR (USD)</span>
                  <span className="text-2xl font-black text-gray-900">{formatUSD(Number(factura.total_usd))}</span>
                </div>
                {Number(factura.tasa_bcv) > 0 && (
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-xs text-gray-500">Equivalente en Bolívares (tasa BCV {Number(factura.tasa_bcv).toFixed(4)})</span>
                    <span className="font-bold text-gray-700">{formatVES(Number(factura.total_ves))}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de pago */}
        {factura.pagos.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Formas de Pago</p>
            <div className="flex flex-wrap gap-2">
              {factura.pagos.map(p => (
                <span key={p.id} className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {p.moneda}: {formatUSD(Number(p.monto))}{p.referencia ? ` · Ref: ${p.referencia}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Observaciones */}
        {factura.observaciones && (
          <div className="px-6 py-3 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Observaciones</p>
            <p className="text-sm text-gray-600">{factura.observaciones}</p>
          </div>
        )}

        {/* Pie fiscal */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-center">
          <p className="text-[10px] text-gray-400">
            Documento emitido conforme a la Providencia Administrativa N° 00071 del SENIAT (G.O. N° 39.795) — 
            Formatos y Formas Libres · Emisor Sujeto a las disposiciones de la LIVA vigente
          </p>
          {config?.mensaje_retenciones && (
            <p className="text-[10px] text-gray-400 mt-0.5">{config.mensaje_retenciones}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-gray-400 text-xs">{label}: </span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  )
}

function TotalRow({ label, valor, purple, amber, orange }: {
  label: string; valor: string; purple?: boolean; amber?: boolean; orange?: boolean
}) {
  return (
    <div className={`flex justify-between text-sm ${purple ? 'text-purple-700' : amber ? 'text-amber-700' : orange ? 'text-orange-700' : 'text-gray-700'}`}>
      <span>{label}</span>
      <span className="font-mono">{valor}</span>
    </div>
  )
}
