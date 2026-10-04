'use client'

import { useState } from 'react'
import { FacturaCxC, Proveedor, FacturaCompra } from '@/types/finanzas.types'
import { formatUSD, formatVES } from '@/lib/fiscal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from 'cn'
import { Users, FileText, Plus, DollarSign, Wallet } from 'lucide-react'
import { RegistrarPagoModal } from './RegistrarPagoModal'
import { ProveedorModal } from './ProveedorModal'
import { RegistrarCompraModal } from './RegistrarCompraModal'

import { useSearchParams, useRouter } from 'next/navigation'

interface FinanzasClientProps {
  cxcFacturas: FacturaCxC[]
  proveedores: Proveedor[]
  compras: FacturaCompra[]
  empresaId: string
  userId: string
}

export default function FinanzasClient({
  cxcFacturas,
  proveedores: initialProveedores,
  compras: initialCompras,
  empresaId,
  userId
}: FinanzasClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const defaultTab = (searchParams.get('tab') as 'cxc' | 'proveedores' | 'cxp') || 'cxc'
  const [activeTab, setActiveTab] = useState<'cxc' | 'proveedores' | 'cxp'>(defaultTab)
  const [selectedFactura, setSelectedFactura] = useState<{ id: string, numero: string, saldo: number } | null>(null)
  const [proveedorModalOpen, setProveedorModalOpen] = useState(false)
  const [proveedoresList, setProveedoresList] = useState<Proveedor[]>(initialProveedores)
  const [compraModalOpen, setCompraModalOpen] = useState(false)
  const [comprasList, setComprasList] = useState<FacturaCompra[]>(initialCompras)

  return (
    <div className="flex flex-col h-full gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="h-7 w-7 text-primary" />
            Finanzas y Cuentas
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Control de cuentas por cobrar a clientes y cuentas por pagar a proveedores.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card/40 backdrop-blur-md border border-border rounded-xl p-1 gap-1">
        <button
          onClick={() => setActiveTab('cxc')}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'cxc' 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <FileText className="h-4 w-4" /> Cuentas por Cobrar
        </button>
        <button
          onClick={() => setActiveTab('proveedores')}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'proveedores' 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Users className="h-4 w-4" /> Proveedores
        </button>
        <button
          onClick={() => setActiveTab('cxp')}
          className={cn(
            "flex-1 py-2.5 px-4 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2",
            activeTab === 'cxp' 
              ? "bg-primary text-primary-foreground shadow-sm" 
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <DollarSign className="h-4 w-4" /> Cuentas por Pagar
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto pb-10">
        {activeTab === 'cxc' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50 p-6">
                <CardHeader className="p-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Cuentas por Cobrar</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="text-2xl font-bold text-foreground">
                    {formatUSD(
                      cxcFacturas.reduce((acc, f) => acc + (f.total_usd - f.pagos.reduce((pAcc, p) => pAcc + p.monto, 0)), 0)
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{cxcFacturas.length} facturas pendientes</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/30 text-muted-foreground uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="px-5 py-4">Factura</th>
                      <th className="px-5 py-4">Cliente</th>
                      <th className="px-5 py-4">Fecha Emisión</th>
                      <th className="px-5 py-4 text-right">Total Factura</th>
                      <th className="px-5 py-4 text-right">Abonado</th>
                      <th className="px-5 py-4 text-right">Saldo Restante</th>
                      <th className="px-5 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {cxcFacturas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                          <FileText className="h-10 w-10 mx-auto opacity-20 mb-3" />
                          No hay cuentas por cobrar registradas.
                        </td>
                      </tr>
                    ) : (
                      cxcFacturas.map((f) => {
                        const abonado = f.pagos.reduce((acc, p) => acc + p.monto, 0)
                        const saldo = Math.max(0, f.total_usd - abonado)
                        
                        return (
                          <tr key={f.id} className="hover:bg-secondary/20 transition-colors">
                            <td className="px-5 py-4 font-semibold text-foreground">{f.numero_factura}</td>
                            <td className="px-5 py-4">
                              <div className="font-medium text-foreground truncate max-w-[200px]">{f.cliente?.razon_social}</div>
                              <div className="text-[11px] text-muted-foreground">{f.cliente?.numero_doc}</div>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground">
                              {new Date(f.fecha_emision).toLocaleDateString('es-VE')}
                            </td>
                            <td className="px-5 py-4 text-right font-medium text-foreground">{formatUSD(f.total_usd)}</td>
                            <td className="px-5 py-4 text-right font-medium text-green-500">{formatUSD(abonado)}</td>
                            <td className="px-5 py-4 text-right font-bold text-destructive">{formatUSD(saldo)}</td>
                            <td className="px-5 py-4 text-center">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 border-primary/20 hover:border-primary text-xs"
                                onClick={() => setSelectedFactura({ id: f.id, numero: f.numero_factura, saldo })}
                              >
                                Registrar Pago
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'proveedores' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Directorio de Proveedores</h3>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                onClick={() => setProveedorModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Nuevo Proveedor
              </Button>
            </div>
            
            <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/30 text-muted-foreground uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="px-5 py-4">Razón Social</th>
                      <th className="px-5 py-4">RIF</th>
                      <th className="px-5 py-4">Contacto</th>
                      <th className="px-5 py-4">Teléfono</th>
                      <th className="px-5 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {proveedoresList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                          <Users className="h-10 w-10 mx-auto opacity-20 mb-3" />
                          No hay proveedores registrados.
                        </td>
                      </tr>
                    ) : (
                      proveedoresList.map((p) => (
                        <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-4 font-semibold text-foreground">{p.razon_social}</td>
                          <td className="px-5 py-4 text-muted-foreground">{p.rif}</td>
                          <td className="px-5 py-4 text-muted-foreground">{p.contacto || '-'}</td>
                          <td className="px-5 py-4 text-muted-foreground">{p.telefono || '-'}</td>
                          <td className="px-5 py-4 text-center">
                            <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-primary/10 hover:text-primary">
                              Editar
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cxp' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-foreground">Compras y Cuentas por Pagar</h3>
              <Button 
                size="sm" 
                className="bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20"
                onClick={() => setCompraModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" /> Registrar Factura de Compra
              </Button>
            </div>
            
            <div className="bg-card/40 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/30 text-muted-foreground uppercase text-[11px] font-semibold">
                    <tr>
                      <th className="px-5 py-4">Factura</th>
                      <th className="px-5 py-4">Proveedor</th>
                      <th className="px-5 py-4">Fecha</th>
                      <th className="px-5 py-4">Condición</th>
                      <th className="px-5 py-4 text-right">Total</th>
                      <th className="px-5 py-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {comprasList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                          <DollarSign className="h-10 w-10 mx-auto opacity-20 mb-3" />
                          No hay compras registradas.
                        </td>
                      </tr>
                    ) : (
                      comprasList.map((c) => (
                        <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-5 py-4 font-semibold text-foreground">{c.numero_factura}</td>
                          <td className="px-5 py-4 font-medium text-foreground">{c.proveedor?.razon_social}</td>
                          <td className="px-5 py-4 text-muted-foreground">{new Date(c.fecha_emision).toLocaleDateString('es-VE')}</td>
                          <td className="px-5 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                              c.condicion_pago === 'CREDITO' ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" : "bg-primary/10 text-primary border border-primary/20"
                            )}>
                              {c.condicion_pago}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-bold text-foreground">
                            {c.moneda === 'USD' ? formatUSD(c.total_factura) : formatVES(c.total_factura)}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-primary/10 hover:text-primary">
                              Detalles
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedFactura && (
        <RegistrarPagoModal
          isOpen={!!selectedFactura}
          onClose={() => setSelectedFactura(null)}
          facturaId={selectedFactura.id}
          numeroFactura={selectedFactura.numero}
          saldoPendiente={selectedFactura.saldo}
          onSuccess={() => {
            setSelectedFactura(null)
            router.refresh()
          }}
        />
      )}
      {/* Proveedor Modal */}
      <ProveedorModal 
        open={proveedorModalOpen}
        onClose={() => setProveedorModalOpen(false)}
        empresaId={empresaId}
        onSuccess={(nuevo) => {
          setProveedoresList(prev => [nuevo, ...prev])
        }}
      />

      {/* Compra Modal */}
      <RegistrarCompraModal 
        open={compraModalOpen}
        onClose={() => setCompraModalOpen(false)}
        empresaId={empresaId}
        userId={userId}
        proveedores={proveedoresList}
        onSuccess={(nuevaCompra) => {
          setComprasList(prev => [nuevaCompra, ...prev])
        }}
      />
    </div>
  )
}
