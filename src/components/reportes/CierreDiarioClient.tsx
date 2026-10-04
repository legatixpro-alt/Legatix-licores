'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatUSD } from '@/lib/fiscal'
import { Download, Calendar, DollarSign, Wallet, Package, AlertTriangle } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CierreDiarioProps {
  targetDate: string
  empresa: any
  facturas: any[]
  pagos: any[]
  alertasStock: any[]
  inventario: { nombre: string; sku: string; inicial: number; final: number }[]
}

export function CierreDiarioClient({ targetDate, empresa, facturas, pagos, alertasStock, inventario }: CierreDiarioProps) {
  const router = useRouter()
  const [date, setDate] = useState(targetDate)

  // Totales de venta
  const totalFacturado = facturas.reduce((acc, f) => acc + Number(f.total_usd), 0)
  
  // Agrupar pagos por moneda/método
  const pagosMap = new Map<string, { cantidad: number; total: number }>()
  pagos.forEach(p => {
    const moneda = p.moneda || 'DESCONOCIDO'
    if (!pagosMap.has(moneda)) {
      pagosMap.set(moneda, { cantidad: 0, total: 0 })
    }
    const curr = pagosMap.get(moneda)!
    curr.cantidad += 1
    curr.total += Number(p.monto)
    pagosMap.set(moneda, curr)
  })
  const pagosAgrupados = Array.from(pagosMap.entries()).map(([metodo, datos]) => ({ metodo, ...datos }))

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value
    setDate(newDate)
    router.push(`/reportes/cierre-diario?date=${newDate}`)
  }

  const exportPDF = () => {
    const doc = new jsPDF()
    const fecha = new Date(targetDate + 'T12:00:00').toLocaleDateString('es-VE')
    
    // Encabezado
    doc.setFontSize(16)
    doc.text(empresa?.razon_social || 'Reporte de Cierre de Caja', 14, 20)
    doc.setFontSize(10)
    if (empresa?.rif) doc.text(`RIF: ${empresa.rif}`, 14, 26)
    
    doc.setFontSize(14)
    doc.text(`Cierre Diario: ${fecha}`, 14, 40)
    
    let currentY = 50

    // 1. Resumen de Ventas
    doc.setFontSize(12)
    doc.text('1. Resumen de Ventas', 14, currentY)
    currentY += 5
    autoTable(doc, {
      startY: currentY,
      head: [['Métrica', 'Valor']],
      body: [
        ['Facturas Emitidas', facturas.length.toString()],
        ['Total Facturado (USD)', formatUSD(totalFacturado)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [41, 41, 41] }
    })
    currentY = (doc as any).lastAutoTable.finalY + 15

    // 2. Formas de Pago
    doc.setFontSize(12)
    doc.text('2. Formas de Pago Recibidas', 14, currentY)
    currentY += 5
    autoTable(doc, {
      startY: currentY,
      head: [['Método / Moneda', 'N° Transacciones', 'Monto Acumulado']],
      body: pagosAgrupados.map(p => [
        p.metodo, 
        p.cantidad.toString(),
        p.metodo === 'USD' ? formatUSD(p.total) : `Bs. ${p.total.toFixed(2)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 41, 41] }
    })
    currentY = (doc as any).lastAutoTable.finalY + 15

    // 3. Inventario
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setFontSize(12)
    doc.text('3. Movimientos de Inventario del Día', 14, currentY)
    currentY += 5
    autoTable(doc, {
      startY: currentY,
      head: [['Código', 'Producto', 'Stock Inicial', 'Stock Final', 'Variación']],
      body: inventario.map(i => [
        i.sku,
        i.nombre,
        i.inicial.toString(),
        i.final.toString(),
        (i.final - i.inicial).toString()
      ]),
      theme: 'grid',
      headStyles: { fillColor: [41, 41, 41] }
    })
    currentY = (doc as any).lastAutoTable.finalY + 15

    // 4. Alertas de Stock
    if (currentY > 250) { doc.addPage(); currentY = 20; }
    doc.setFontSize(12)
    doc.text('4. Alertas de Stock Mínimo', 14, currentY)
    currentY += 5
    autoTable(doc, {
      startY: currentY,
      head: [['Código', 'Producto', 'Stock Actual', 'Mínimo Permitido']],
      body: alertasStock.map(a => [
        a.codigo_sku,
        a.nombre,
        a.stock_actual.toString(),
        a.stock_minimo?.toString() || '5'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [180, 40, 40] } // Rojo para alertas
    })

    doc.save(`Cierre_${targetDate}.pdf`)
  }

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Cierre Diario</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de caja, ventas e inventario del día seleccionado.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-md px-3 py-1.5 backdrop-blur-md">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input 
              type="date" 
              value={date} 
              onChange={handleDateChange}
              className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 w-auto text-sm"
            />
          </div>
          <Button onClick={exportPDF} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-black/40 border-white/10 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Total Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(totalFacturado)}</div>
            <p className="text-xs text-muted-foreground mt-1">{facturas.length} facturas procesadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-xl">
          <CardHeader className="border-b border-border/50 bg-secondary/30">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Formas de Pago Recibidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pagosAgrupados.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No hay pagos registrados este día.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/20">
                  <tr>
                    <th className="text-left font-medium py-4 pl-6 pr-4">Método / Moneda</th>
                    <th className="text-center font-medium py-4 px-4">Transacciones</th>
                    <th className="text-right font-medium py-4 pl-4 pr-6">Monto Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {pagosAgrupados.map((p, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-6 pr-4 font-medium text-base">{p.metodo}</td>
                      <td className="py-4 px-4 text-center">{p.cantidad}</td>
                      <td className="py-4 pl-4 pr-6 text-right text-primary font-bold text-base">
                        {p.metodo === 'USD' ? formatUSD(p.total) : `Bs. ${p.total.toFixed(2)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-xl">
          <CardHeader className="border-b border-border/50 bg-secondary/30">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Alertas de Stock Mínimo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {alertasStock.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Inventario saludable.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-secondary/20">
                  <tr>
                    <th className="text-left font-medium py-4 pl-6 pr-4">Producto</th>
                    <th className="text-right font-medium py-4 pl-4 pr-6">Stock Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {alertasStock.map(p => (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-6 pr-4">
                        <p className="font-medium text-base">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-1">{p.codigo_sku}</p>
                      </td>
                      <td className="py-4 pl-4 pr-6 text-right">
                        <span className="bg-destructive/20 text-destructive px-3 py-1.5 rounded-md font-bold text-base">
                          {p.stock_actual}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-md shadow-xl">
        <CardHeader className="border-b border-border/50 bg-secondary/30">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Movimientos de Inventario del Día
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {inventario.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No hubo movimientos de inventario.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/20">
                <tr>
                  <th className="text-left font-medium py-4 pl-6 pr-4">Producto</th>
                  <th className="text-center font-medium py-4 px-4">Stock Inicial</th>
                  <th className="text-center font-medium py-4 px-4">Stock Final</th>
                  <th className="text-right font-medium py-4 pl-4 pr-6">Variación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {inventario.map((item, i) => {
                  const dif = item.final - item.inicial
                  return (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-6 pr-4">
                        <p className="font-medium text-base">{item.nombre}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.sku}</p>
                      </td>
                      <td className="py-4 px-4 text-center text-base">{item.inicial}</td>
                      <td className="py-4 px-4 text-center text-base">{item.final}</td>
                      <td className="py-4 pl-4 pr-6 text-right">
                        <span className={`font-bold text-base ${dif > 0 ? 'text-green-500' : dif < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {dif > 0 ? '+' : ''}{dif}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
