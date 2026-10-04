'use client'

import { useMemo } from 'react'
import { 
  Download, BookOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LibroVentasRow, ConfigFiscal } from '@/types/facturacion.types'
import { formatUSD } from '@/lib/fiscal'

interface Props {
  rows: LibroVentasRow[]
  mes: number
  anio: number
  config: ConfigFiscal | null
}

export function LibroVentasClient({ rows, mes, anio, config }: Props) {
  const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ]

  // Totales del período
  const totales = useMemo(() => ({
    exento:             rows.reduce((s, r) => s + Number(r.monto_exento), 0),
    base_general:       rows.reduce((s, r) => s + Number(r.base_imponible_general), 0),
    iva_general:        rows.reduce((s, r) => s + Number(r.monto_iva_general), 0),
    base_adicional:     rows.reduce((s, r) => s + Number(r.base_imponible_adicional), 0),
    iva_adicional:      rows.reduce((s, r) => s + Number(r.monto_iva_adicional), 0),
    total_iva:          rows.reduce((s, r) => s + Number(r.total_iva), 0),
    igtf:               rows.reduce((s, r) => s + Number(r.monto_igtf), 0),
    total_usd:          rows.reduce((s, r) => s + Number(r.total_usd), 0),
  }), [rows])

  const exportarCSV = () => {
    const headers = [
      'Fecha','N° Factura','N° Control','Tipo Documento',
      'Tipo Doc. Cliente','RIF/CI Cliente','Nombre Cliente',
      'Monto Exento',
      `Base Grav. Gral (${config?.alicuota_iva_general ?? 16}%)`,
      `IVA General (${config?.alicuota_iva_general ?? 16}%)`,
      'Total IVA',
      'Total USD','Tasa BCV','Total Bs.','Estatus'
    ]
    const csvRows = [
      headers.join(';'),
      ...rows.map(r => [
        r.fecha_emision, r.numero_factura, r.numero_control,
        r.tipo_documento, r.tipo_doc_cliente, r.rif_cliente, r.nombre_cliente,
        r.monto_exento, r.base_imponible_general, r.monto_iva_general,
        r.total_iva,
        r.total_usd, r.tasa_bcv, r.total_ves, r.estatus
      ].join(';'))
    ]
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `Libro_Ventas_${MESES[mes-1]}_${anio}.csv`
    a.click()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Libro de Ventas
          </h2>
          <p className="text-sm text-gray-500">
            {MESES[mes-1]} {anio} · {rows.length} documentos · Alimenta la Declaración de IVA (Forma 30)
          </p>
        </div>
        <Button onClick={exportarCSV} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Download className="h-4 w-4" />
          Exportar CSV (SENIAT)
        </Button>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <ResumenCard
          label="Total Ventas"
          valor={formatUSD(totales.total_usd)}
          sub={`${rows.length} documentos`}
          color="blue"
        />
        <ResumenCard
          label={`IVA General (${config?.alicuota_iva_general ?? 16}%)`}
          valor={formatUSD(totales.iva_general)}
          sub={`Base: ${formatUSD(totales.base_general)}`}
          color="purple"
        />
      </div>

      {/* Resumen para declaración */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm text-blue-900">
            📋 Resumen para Declaración IVA — Forma 30 ({MESES[mes-1]} {anio})
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-blue-600 font-medium">Ventas Exentas</p>
              <p className="font-bold text-blue-900">{formatUSD(totales.exento)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Base Grav. Gral.</p>
              <p className="font-bold text-blue-900">{formatUSD(totales.base_general)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-medium">IVA General Débito Fiscal</p>
              <p className="font-bold text-blue-900 text-lg">{formatUSD(totales.iva_general)}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
            <span className="text-sm font-semibold text-blue-900">
              TOTAL DÉBITO FISCAL IVA: {formatUSD(totales.total_iva)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Tabla del libro de ventas */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Fecha</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">N° Fact.</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">N° Control</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">RIF/CI Cliente</th>
                <th className="text-left px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Cliente</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Exento</th>
                <th className="text-right px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Base Gral.</th>
                <th className="text-right px-3 py-3 font-semibold text-purple-500 uppercase text-[10px] tracking-wider">IVA Gral.</th>

                <th className="text-right px-3 py-3 font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Total USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600">{r.fecha_emision}</td>
                  <td className="px-3 py-2 font-mono font-semibold">{r.numero_factura}</td>
                  <td className="px-3 py-2 font-mono text-gray-500">{r.numero_control}</td>
                  <td className="px-3 py-2 text-gray-700">{r.tipo_doc_cliente}-{r.rif_cliente}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate">{r.nombre_cliente}</td>
                  <td className="px-3 py-2 text-right font-mono">{Number(r.monto_exento) > 0 ? formatUSD(Number(r.monto_exento)) : '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatUSD(Number(r.base_imponible_general))}</td>
                  <td className="px-3 py-2 text-right font-mono text-purple-700">{formatUSD(Number(r.monto_iva_general))}</td>

                  <td className="px-3 py-2 text-right font-mono font-bold">{formatUSD(Number(r.total_usd))}</td>
                </tr>
              ))}
              {/* Fila de totales */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-bold">
                <td colSpan={5} className="px-3 py-2 text-xs text-gray-700 uppercase">TOTALES DEL PERÍODO</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{formatUSD(totales.exento)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{formatUSD(totales.base_general)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-purple-700">{formatUSD(totales.iva_general)}</td>

                <td className="px-3 py-2 text-right font-mono text-sm text-gray-900">{formatUSD(totales.total_usd)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ResumenCard({ label, valor, sub, color }: {
  label: string; valor: string; sub: string; color: string
}) {
  const colorClass: Record<string, string> = {
    blue:   'border-blue-100 bg-blue-50',
    purple: 'border-purple-100 bg-purple-50',
    amber:  'border-amber-100 bg-amber-50',
    orange: 'border-orange-100 bg-orange-50',
  }
  return (
    <Card className={`border ${colorClass[color]}`}>
      <CardContent className="px-4 py-3">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-900">{valor}</p>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </CardContent>
    </Card>
  )
}
