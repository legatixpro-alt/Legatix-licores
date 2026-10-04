'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  FileText, Plus, Search, 
  Download, 
  CheckCircle2,
  XCircle, Clock, Eye, Printer,
  Receipt, AlertCircle, TrendingUp, CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Factura, Cliente, ConfigFiscal, EstatusFactura } from '@/types/facturacion.types'
import { formatUSD, formatVES } from '@/lib/fiscal'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface Props {
  facturas: Factura[]
  clientes: Cliente[]
  configFiscal: ConfigFiscal | null
  empresaId: string
  empresa?: any
}

const ESTATUS_CONFIG: Record<EstatusFactura, { label: string; color: string; icon: React.ReactNode }> = {
  EMITIDA:  { label: 'Emitida',  color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: <Receipt className="h-3 w-3" /> },
  PAGADA:   { label: 'Pagada',   color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  ANULADA:  { label: 'Anulada',  color: 'bg-red-100 text-red-700 border-red-200',       icon: <XCircle className="h-3 w-3" /> },
  BORRADOR: { label: 'Borrador', color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: <Clock className="h-3 w-3" /> },
}

export function FacturasClient({ facturas, configFiscal, empresa }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState<EstatusFactura | 'TODOS'>('TODOS')
  const [filtroTipo, setFiltroTipo] = useState<string>('TODOS')

  // ── Métricas del mes ──────────────────────────────────────
  const metricas = useMemo(() => {
    const emitidas = facturas.filter(f => f.estatus !== 'ANULADA')
    const totalUsd  = emitidas.reduce((s, f) => s + Number(f.total_usd), 0)
    const totalIva  = emitidas.reduce((s, f) => s + Number(f.total_iva_usd), 0)
    return {
      cantidad: emitidas.length,
      totalUsd, 
      totalIva,
      anuladas: facturas.filter(f => f.estatus === 'ANULADA').length 
    }
  }, [facturas])

  // ── Filtrado ──────────────────────────────────────────────
  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => {
      const cliente = (f as Factura & { cliente?: Cliente }).cliente
      const textoCliente = cliente ? `${cliente.razon_social} ${cliente.numero_doc}` : ''
      const matchBusqueda = !busqueda || 
        f.numero_factura.includes(busqueda) ||
        f.numero_control.toLowerCase().includes(busqueda.toLowerCase()) ||
        textoCliente.toLowerCase().includes(busqueda.toLowerCase())
      const matchEstatus = filtroEstatus === 'TODOS' || f.estatus === filtroEstatus
      const matchTipo    = filtroTipo === 'TODOS' || f.tipo_documento === filtroTipo
      return matchBusqueda && matchEstatus && matchTipo
    })
  }, [facturas, busqueda, filtroEstatus, filtroTipo])

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Encabezado de la empresa
    doc.setFontSize(16)
    doc.text(empresa?.razon_social || 'Reporte de Facturación', 14, 20)
    
    doc.setFontSize(10)
    if (empresa?.rif) doc.text(`RIF: ${empresa.rif}`, 14, 26)
    if (empresa?.direccion) {
      doc.setFontSize(9)
      const splitDir = doc.splitTextToSize(`Dirección: ${empresa.direccion}`, 180)
      doc.text(splitDir, 14, 31)
    }

    doc.setFontSize(12)
    doc.text('Lista de Facturas Emitidas', 14, 45)
    doc.setFontSize(9)
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-VE')}`, 14, 50)

    // Datos para la tabla
    const tableBody = facturasFiltradas.map(f => [
      f.numero_factura,
      new Date(f.fecha_emision).toLocaleDateString('es-VE'),
      f.cliente?.razon_social || 'Desconocido',
      f.cliente?.numero_doc || '-',
      f.condicion_pago,
      f.estatus,
      formatUSD(Number(f.total_usd))
    ])

    autoTable(doc, {
      startY: 55,
      head: [['Número', 'Fecha', 'Cliente', 'Documento', 'Condición', 'Estatus', 'Total (USD)']],
      body: tableBody,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 41, 41], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    })

    doc.save(`Facturas_${new Date().getTime()}.pdf`)
  }

  const configOk = !!configFiscal

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Facturación</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Módulo conforme a normativa SENIAT — Providencia 00071/2011
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
            <Download className="h-4 w-4" />
            Exportar a PDF
          </Button>
          <Link href="/facturacion/nueva">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Factura
            </Button>
          </Link>
        </div>
      </div>

      {/* Alerta si no hay config fiscal */}
      {!configOk && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800">Configuración Fiscal Requerida</p>
            <p className="text-sm text-amber-700 mt-1">
              Debe configurar los datos fiscales de la empresa (alícuotas IVA, IGTF, numeración) 
              antes de emitir facturas.{' '}
              <Link href="/configuracion" className="underline font-medium">Ir a Configuración →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Métricas del mes */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricaCard
          label="Total Facturado (mes)"
          valor={formatUSD(metricas.totalUsd)}
          sub={`${metricas.cantidad} documentos`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <MetricaCard
          label="IVA Generado"
          valor={formatUSD(metricas.totalIva)}
          sub={`Alíc. Gral ${configFiscal?.alicuota_iva_general ?? 16}%`}
          icon={<Receipt className="h-4 w-4" />}
        />

        <MetricaCard
          label="Documentos Anulados"
          valor={String(metricas.anuladas)}
          sub="Requieren nota de crédito"
          icon={<XCircle className="h-4 w-4" />}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por N° factura, control o cliente..."
            className="pl-9 h-10 bg-card border-border focus:border-primary text-foreground transition-all"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {(['TODOS', 'EMITIDA', 'PAGADA', 'ANULADA', 'BORRADOR'] as const).map(e => (
            <button
              key={e}
              onClick={() => setFiltroEstatus(e)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                filtroEstatus === e 
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(245,176,39,0.3)]' 
                  : 'bg-card/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {e === 'TODOS' ? 'Todos' : ESTATUS_CONFIG[e].label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {['TODOS', 'FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO'].map(t => (
            <button
              key={t}
              onClick={() => setFiltroTipo(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                filtroTipo === t 
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_10px_rgba(245,176,39,0.3)]' 
                  : 'bg-card/50 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {t === 'TODOS' ? 'Todos Tipos' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de facturas */}
      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">N° Control</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">N° Factura</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Tipo</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Fecha</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente / RIF</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Base Imp.</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">IVA</th>

                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total USD</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Bs.</th>
                <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estatus</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {facturasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30 text-primary" />
                    <p className="font-medium">No se encontraron facturas</p>
                    <p className="text-xs mt-1 text-muted-foreground/60">Crea tu primera factura con el bot&oacute;n &quot;Nueva Factura&quot;</p>
                  </td>
                </tr>
              ) : (
                facturasFiltradas.map(f => {
                  const cliente = (f as Factura & { cliente?: Cliente }).cliente
                  const est = ESTATUS_CONFIG[f.estatus]
                  return (
                    <tr key={f.id} className="hover:bg-secondary/30 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs text-foreground font-semibold">{f.numero_control}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.numero_factura}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          f.tipo_documento === 'FACTURA' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          f.tipo_documento === 'NOTA_CREDITO' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                          'bg-orange-500/10 text-orange-400 border-orange-500/20'
                        }`}>
                          {f.tipo_documento.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{f.fecha_emision}</td>
                      <td className="px-4 py-3">
                        {cliente ? (
                          <div>
                            <p className="font-medium text-foreground truncate max-w-[180px]">{cliente.razon_social}</p>
                            <p className="text-xs text-muted-foreground/80">{cliente.tipo_doc}-{cliente.numero_doc}</p>
                          </div>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {formatUSD(Number(f.subtotal_usd))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-purple-400">
                        {formatUSD(Number(f.total_iva_usd))}
                      </td>

                      <td className="px-4 py-3 text-right font-mono text-sm font-bold text-foreground">
                        {formatUSD(Number(f.total_usd))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {formatVES(Number(f.total_ves))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${est.color}`}>
                          {est.icon}
                          {est.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/facturacion/${f.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" title="Ver detalle">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/facturacion/${f.id}/imprimir`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary" title="Imprimir">
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border/50 bg-secondary/30 flex items-center justify-between text-xs text-muted-foreground">
          <span>Mostrando {facturasFiltradas.length} de {facturas.length} documentos del mes</span>
          <span className="font-mono">IVA General: {configFiscal?.alicuota_iva_general ?? 16}%</span>
        </div>
      </div>
    </div>
  )
}

function MetricaCard({ label, valor, sub, icon }: {
  label: string; valor: string; sub: string; icon: React.ReactNode
}) {
  return (
    <Card className="glass-card border-border/50 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10 transition-transform group-hover:scale-110"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-5 pt-5">
        <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate mr-2">{label}</CardTitle>
        <div className="p-2 bg-black/50 rounded-lg border border-white/5 shadow-inner group-hover:border-primary/40 transition-colors flex-shrink-0 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="text-2xl font-extrabold tracking-tight text-foreground drop-shadow-sm truncate">{valor}</div>
        <p className="text-[11px] font-medium text-muted-foreground/80 mt-1 truncate">
          {sub}
        </p>
      </CardContent>
    </Card>
  )
}
