'use client'

import { FacturaConRelaciones } from '@/types/facturacion.types'
import { formatVES } from '@/lib/fiscal'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface Props {
  facturas: FacturaConRelaciones[]
  mes: string
  anio: string
}

export function LibroVentasClient({ facturas, mes, anio }: Props) {
  
  const exportarCSV = () => {
    const headers = [
      'Nro',
      'Fecha Documento',
      'RIF/CI',
      'Nombre o Razón Social',
      'Nro Factura',
      'Nro Control',
      'Total Ventas Incluyendo IVA',
      'Ventas Internas Exoneradas',
      'Base Imponible',
      '% Alicuota General',
      'Impuesto IVA',
      'Base Imponible Licores',
      '% Alicuota Licores',
      'Impuesto Licores',
      'IGTF'
    ]

    const filas = facturas.map((f, i) => {
      const clienteNombre = f.cliente ? f.cliente.razon_social : 'Consumidor Final'
      const clienteRif = f.cliente ? f.cliente.numero_doc : 'V-000000000'
      
      return [
        i + 1,
        f.fecha_emision,
        clienteRif,
        clienteNombre,
        f.numero_factura,
        f.numero_control,
        f.total_ves.toFixed(2),
        (f.monto_exento * f.tasa_bcv).toFixed(2),
        (f.base_imponible_general * f.tasa_bcv).toFixed(2),
        `${f.alicuota_iva_general_aplicada}%`,
        (f.monto_iva_general * f.tasa_bcv).toFixed(2),
        (f.base_imponible_adicional * f.tasa_bcv).toFixed(2),
        `${f.alicuota_iva_adicional_aplicada}%`,
        (f.monto_iva_adicional * f.tasa_bcv).toFixed(2),
        (f.monto_igtf * f.tasa_bcv).toFixed(2)
      ].join(',')
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...filas].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Libro_Ventas_${anio}_${mes}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Cálculos totales para el pie de página
  const totales = facturas.reduce((acc, f) => {
    acc.total += f.total_ves
    acc.exento += (f.monto_exento * f.tasa_bcv)
    acc.base_general += (f.base_imponible_general * f.tasa_bcv)
    acc.iva_general += (f.monto_iva_general * f.tasa_bcv)
    acc.base_adicional += (f.base_imponible_adicional * f.tasa_bcv)
    acc.iva_adicional += (f.monto_iva_adicional * f.tasa_bcv)
    return acc
  }, { total: 0, exento: 0, base_general: 0, iva_general: 0, base_adicional: 0, iva_adicional: 0 })

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-foreground">Libro de Ventas SENIAT (VES)</h2>
        <Button onClick={exportarCSV} variant="outline" className="border-border text-foreground hover:bg-secondary">
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="border border-border/50 rounded-xl overflow-x-auto glass-card bg-card/60 backdrop-blur-xl shadow-xl">
        <table className="w-full text-xs text-left whitespace-nowrap">
          <thead className="bg-secondary/50 border-b border-border/50">
            <tr>
              <th className="p-3 font-semibold text-muted-foreground">Fecha</th>
              <th className="p-3 font-semibold text-muted-foreground">Factura</th>
              <th className="p-3 font-semibold text-muted-foreground">Control</th>
              <th className="p-3 font-semibold text-muted-foreground">Cliente</th>
              <th className="p-3 font-semibold text-muted-foreground">RIF/CI</th>
              <th className="p-3 font-semibold text-muted-foreground text-right">Total c/IVA</th>
              <th className="p-3 font-semibold text-muted-foreground text-right">Exento</th>
              <th className="p-3 font-semibold text-muted-foreground text-right">Base Imp.</th>
              <th className="p-3 font-semibold text-muted-foreground text-right">IVA General</th>
              <th className="p-3 font-semibold text-muted-foreground text-right">Base Licores</th>
              <th className="p-3 font-semibold text-muted-foreground text-right">IVA Licores</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {facturas.map((f) => (
              <tr key={f.id} className="hover:bg-secondary/30 transition-colors group">
                <td className="p-3 text-foreground">{f.fecha_emision}</td>
                <td className="p-3 text-foreground">{f.numero_factura}</td>
                <td className="p-3 text-foreground">{f.numero_control}</td>
                <td className="p-3 text-foreground truncate max-w-[150px]">{f.cliente ? f.cliente.razon_social : 'Consumidor Final'}</td>
                <td className="p-3 text-foreground">{f.cliente ? f.cliente.numero_doc : 'V-000000000'}</td>
                <td className="p-3 text-right font-medium text-foreground">{formatVES(f.total_ves)}</td>
                <td className="p-3 text-right text-muted-foreground">{formatVES(f.monto_exento * f.tasa_bcv)}</td>
                <td className="p-3 text-right text-muted-foreground">{formatVES(f.base_imponible_general * f.tasa_bcv)}</td>
                <td className="p-3 text-right text-muted-foreground">{formatVES(f.monto_iva_general * f.tasa_bcv)}</td>
                <td className="p-3 text-right text-muted-foreground">{formatVES(f.base_imponible_adicional * f.tasa_bcv)}</td>
                <td className="p-3 text-right text-muted-foreground">{formatVES(f.monto_iva_adicional * f.tasa_bcv)}</td>
              </tr>
            ))}
            {facturas.length === 0 && (
              <tr>
                <td colSpan={11} className="p-8 text-center text-muted-foreground">
                  No hay facturas registradas en este período.
                </td>
              </tr>
            )}
          </tbody>
          {facturas.length > 0 && (
            <tfoot className="bg-secondary/30 border-t border-border/50 font-bold">
              <tr>
                <td colSpan={5} className="p-3 text-right text-muted-foreground">TOTALES DEL MES (VES):</td>
                <td className="p-3 text-right text-primary text-sm">{formatVES(totales.total)}</td>
                <td className="p-3 text-right text-foreground">{formatVES(totales.exento)}</td>
                <td className="p-3 text-right text-foreground">{formatVES(totales.base_general)}</td>
                <td className="p-3 text-right text-foreground">{formatVES(totales.iva_general)}</td>
                <td className="p-3 text-right text-foreground">{formatVES(totales.base_adicional)}</td>
                <td className="p-3 text-right text-foreground">{formatVES(totales.iva_adicional)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        * Todos los montos del Libro de Ventas se expresan en Bolívares (VES) a la tasa de cambio de la fecha de la operación, según la Providencia SENIAT.
      </p>
    </div>
  )
}
