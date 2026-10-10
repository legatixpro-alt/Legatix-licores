'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { usePOSStore } from '@/store/posStore'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Minus, Zap, UserCircle, ShoppingCart, AlertCircle, ChevronDown, RefreshCw, Lock } from 'lucide-react'
import { Cliente, ConfigFiscal, MonedaPago } from '@/types/facturacion.types'
import { calcularFacturaFiscal, formatUSD, formatVES } from '@/lib/fiscal'
import { useRouter } from 'next/navigation'
import { emitirFacturaPOS } from '@/app/actions/facturacion'
import { getTasaBcv, forceSyncTasaBcv } from '@/app/actions/bcv'
import { impresoraFiscal } from '@/lib/impresora-fiscal'
import { enqueueAction } from '@/lib/offline-db'
import { useNetwork } from '@/hooks/use-network'
import { processSyncQueue } from '@/lib/sync-manager'
import { cn } from 'cn'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogOverlay, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CierreCajaModal } from './CierreCajaModal'

interface Props {
  clientes: Cliente[]
  configFiscal: ConfigFiscal
  empresaId: string
  userId: string
}

export function CartPanel({ clientes, configFiscal, empresaId, userId }: Props) {
  const { 
    items, 
    removeItem, 
    updateQuantity, 
    clearCart,
    clienteId,
    setClienteId,
    metodoPago,
    setMetodoPago,
    pagandoEnDivisas,
    setPagandoEnDivisas,
    pagos,
    addPago,
    removePago,
    condicionPago,
    setCondicionPago
  } = usePOSStore()

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false)
  const [cierreCajaOpen, setCierreCajaOpen] = useState(false)
  const [pagoMontoIn, setPagoMontoIn] = useState('')
  const [pagoMetodoIn, setPagoMetodoIn] = useState('EFECTIVO_BS')

  // ── IGTF eliminado ──
  const aplicaIgtf = false;

  const router = useRouter()
  
  const { isOnline, pendingCount, refreshQueueCount } = useNetwork()

  // Sincronizar al volver online
  useEffect(() => {
    if (isOnline) {
      processSyncQueue().then(() => refreshQueueCount())
    }
  }, [isOnline, refreshQueueCount])

  const [clientSearch, setClientSearch] = useState('')
  const [showClientDropdown, setShowClientDropdown] = useState(false)
  const clientDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (clienteId) {
      const c = clientes.find(c => c.id === clienteId)
      if (c) {
        setClientSearch(`${c.razon_social} (${c.numero_doc})`)
      }
    } else {
      setClientSearch('Consumidor Final')
    }
  }, [clienteId, clientes])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false)
        if (clienteId) {
          const c = clientes.find(c => c.id === clienteId)
          if (c) setClientSearch(`${c.razon_social} (${c.numero_doc})`)
        } else {
          setClientSearch('Consumidor Final')
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [clienteId, clientes])

  const filteredClientes = clientes.filter(c => 
    c.razon_social.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.numero_doc.toLowerCase().includes(clientSearch.toLowerCase())
  )

  // ── Tasa BCV ──────────────────────────────────────────────────────
  const [tasaBcv, setTasaBcv] = useState<number>(40.00)
  const [isFetchingBcv, setIsFetchingBcv] = useState(false)

  const fetchBcvRate = async () => {
    setIsFetchingBcv(true)
    const res = await getTasaBcv()
    if (res.success && res.tasa) {
      setTasaBcv(res.tasa)
    }
    setIsFetchingBcv(false)
  }

  const handleForceSync = async () => {
    setIsFetchingBcv(true)
    const res = await forceSyncTasaBcv()
    if (res.success && res.tasa) {
      setTasaBcv(res.tasa)
    }
    setIsFetchingBcv(false)
  }

  // Cargar tasa automáticamente al montar
  useEffect(() => {
    fetchBcvRate()
  }, [])

  // ── Totales ————————————————————
  const totales = useMemo(() => {
    return calcularFacturaFiscal(
      items.map(i => ({ ...i, precio_unitario_usd: i.precio_unitario_usd })),
      configFiscal,
      tasaBcv,
      'VES', // monedaPrincipal
      false  // aplicaIgtf
    )
  }, [items, configFiscal, tasaBcv])

  // Sincronizar el store con el estado local del toggle
  useEffect(() => {
    setPagandoEnDivisas(aplicaIgtf)
  }, [aplicaIgtf, setPagandoEnDivisas])

  // Al abrir el modal, asegurar limpieza
  const handleOpenCheckout = () => {
    setCheckoutModalOpen(true)
  }

  const handleCheckout = async () => {
    if (items.length === 0) return
    
    if (condicionPago === 'CREDITO' && !clienteId) {
      setErrorMsg('Debes seleccionar un cliente registrado para dar crédito.')
      return
    }

    setLoading(true)
    setErrorMsg(null)

    try {
      const payloadPagos = pagos.map(p => ({
        moneda: (p.metodo === 'EFECTIVO_USD' || p.metodo === 'USD') ? 'USD' : 'VES',
        monto: (p.metodo === 'EFECTIVO_USD' || p.metodo === 'USD') ? p.montoUSD : p.montoVES,
        referencia: p.metodo
      }))

      const payload = {
        empresa_id: empresaId,
        cliente_id: clienteId,
        usuario_id: userId,
        condicion_pago: condicionPago,
        moneda_principal: 'VES' as MonedaPago,
        tasa_bcv: tasaBcv,
        pagos: payloadPagos,
        items: items.map(i => ({
          producto_id: i.producto_id,
          descripcion: i.descripcion,
          codigo_sku: i.codigo_sku,
          unidad_medida: i.unidad_medida,
          cantidad: i.cantidad,
          precio_unitario_usd: i.precio_unitario_usd,
          descuento_pct: i.descuento_pct,
          tipo_alicuota: i.tipo_alicuota,
          aplica_alicuota_adicional: i.aplica_alicuota_adicional
        }))
      }

      let facturaIdRes = 'offline-' + Date.now()

      if (!isOnline) {
        // MODO OFFLINE
        await enqueueAction('pos_checkout', payload)
        refreshQueueCount()
        console.log("Guardado localmente por modo offline.")
      } else {
        // MODO ONLINE
        const res = await emitirFacturaPOS(payload)
        
        if (!res.success) {
          setErrorMsg("Error: " + res.error)
          return
        }
        facturaIdRes = res.factura_id || facturaIdRes
      }
      
      const clienteData = clienteId 
        ? clientes.find(c => c.id === clienteId)
        : { razon_social: 'CONSUMIDOR FINAL', tipo_doc: 'V', numero_doc: '00000000', direccion_fiscal: '', telefono: '' }
        
      impresoraFiscal.imprimirFactura(
        { numero_factura: facturaIdRes, fecha_emision: new Date().toISOString(), tasa_bcv: tasaBcv, moneda_principal: 'VES', aplica_igtf: false, monto_igtf: 0 } as any,
        items as any,
        clienteData as any,
        configFiscal
      ).then(resultadoFiscal => {
        if (resultadoFiscal.exito) {
          console.log("Ticket Fiscal Impreso: " + resultadoFiscal.mensaje)
        } else {
          alert("Error Fiscal: " + resultadoFiscal.mensaje)
        }
      })
      
      clearCart()
      setCheckoutModalOpen(false)
      
      if (condicionPago === 'CREDITO') {
        router.push(`/finanzas?tab=cxc`)
      } else {
        if (isOnline) {
          router.push(`/facturacion/${facturaIdRes}`)
        } else {
          // Si estamos offline, no podemos ir a la vista de factura en el server
          alert("Factura guardada localmente. Revise la cola de sincronización.")
          router.refresh()
        }
      }
    } catch (e) {
      console.error(e)
      setErrorMsg("Error procesando el pago. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-sm text-foreground leading-none">Carrito</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {items.length === 0 ? 'Vacío' : `${items.length} producto${items.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/10"
              title="Vaciar carrito"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => setCierreCajaOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 transition-colors px-3 py-1.5 rounded-md"
            title="Cerrar Caja (Reporte Z)"
          >
            <Lock className="h-3.5 w-3.5" />
            Cerrar Turno
          </button>
        </div>
      </div>
      
      <CierreCajaModal 
        open={cierreCajaOpen} 
        onClose={() => setCierreCajaOpen(false)} 
      />

      {/* ── Cliente selector ───────────────────────── */}
      <div className="px-5 py-3 border-b border-border bg-muted/20">
        <div className="relative flex items-center gap-2" ref={clientDropdownRef}>
          <UserCircle className="text-muted-foreground w-4 h-4 flex-shrink-0 pointer-events-none" />
          <div className="relative flex-1">
            <input
              type="text"
              value={clientSearch}
              onFocus={() => {
                setShowClientDropdown(true)
                if (clienteId === null) setClientSearch('') 
              }}
              onChange={(e) => {
                setClientSearch(e.target.value)
                setShowClientDropdown(true)
              }}
              placeholder="Buscar cliente (CI/RIF/Nombre)..."
              className="w-full h-8 appearance-none rounded-md border border-border bg-background text-xs text-foreground pl-2.5 pr-7 outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-colors"
            />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            
            {showClientDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card shadow-xl z-50 py-1">
                <button
                  className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 text-foreground transition-colors"
                  onClick={() => {
                    setClienteId(null)
                    setClientSearch('Consumidor Final')
                    setShowClientDropdown(false)
                  }}
                >
                  Consumidor Final
                </button>
                {filteredClientes.length === 0 ? (
                   <div className="px-3 py-2 text-xs text-muted-foreground">No hay resultados</div>
                ) : (
                  filteredClientes.map(c => (
                    <button
                      key={c.id}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-secondary/50 text-foreground transition-colors"
                      onClick={() => {
                        setClienteId(c.id)
                        setClientSearch(`${c.razon_social} (${c.numero_doc})`)
                        setShowClientDropdown(false)
                      }}
                    >
                      {c.razon_social} <span className="text-muted-foreground opacity-60 ml-1">({c.numero_doc})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Items list ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground py-12">
            <ShoppingCart className="h-10 w-10 opacity-15" />
            <p className="text-sm text-center">Selecciona un producto<br />para añadirlo al carrito</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="group rounded-lg border border-border bg-card px-2.5 py-2 transition-colors hover:border-border/80"
            >
              {/* Name + delete row */}
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <p className="font-medium text-xs leading-tight line-clamp-2 flex-1 text-foreground">
                  {item.nombre}
                </p>
                <button
                  className="h-5 w-5 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors -mr-1 -mt-0.5"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>

              {/* Tags (if any) */}
              {(item.aplica_alicuota_adicional || item.tipo_alicuota === 'EXENTO') && (
                <div className="flex gap-1.5 mb-1.5">
                  {item.aplica_alicuota_adicional && (
                    <span className="text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0 rounded">
                      Licor
                    </span>
                  )}
                  {item.tipo_alicuota === 'EXENTO' && (
                    <span className="text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0 rounded">
                      Exento
                    </span>
                  )}
                </div>
              )}

              {/* Qty controls + price */}
              <div className="flex items-center justify-between">
                <div className="flex items-center bg-secondary rounded border border-border overflow-hidden">
                  <button
                    className="h-6 w-6 flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-foreground">
                    {item.cantidad}
                  </span>
                  <button
                    className="h-6 w-6 flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    {formatUSD(item.precio_unitario_usd)} c/u
                  </span>
                  <span className="font-bold text-sm text-primary">
                    {formatUSD(item.precio_unitario_usd * item.cantidad)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Totals & checkout ──────────────────────── */}
      <div className="border-t border-border bg-card/50 px-5 pt-4 pb-5 space-y-3">
        {/* Tasa BCV Edit/Fetch */}
        <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-border/50">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleForceSync}
              disabled={isFetchingBcv}
              className="p-1 rounded bg-secondary hover:bg-secondary/80 text-foreground transition-colors disabled:opacity-50"
              title="Actualizar Tasa BCV Oficial"
            >
              <RefreshCw className={cn("h-3 w-3", isFetchingBcv && "animate-spin")} />
            </button>
            <span className="font-semibold text-muted-foreground uppercase tracking-wide">Tasa BCV:</span>
          </div>
          <div className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-md border border-border">
            <span className="text-muted-foreground font-bold">Bs.</span>
            <input
              type="number"
              step="0.01"
              className="w-16 h-6 text-right bg-transparent outline-none font-bold text-foreground focus:text-primary transition-colors"
              value={tasaBcv || ''}
              onChange={e => setTasaBcv(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>

        {/* Subtotal / IVA */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatUSD(totales.subtotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>IVA ({configFiscal.alicuota_iva_general}%)</span>
            <span>{formatUSD(totales.total_iva)}</span>
          </div>
        </div>

        {/* Total */}
        <div className="rounded-xl bg-secondary/50 border border-border px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Total</span>
          <div className="text-right">
            <div className="text-2xl font-extrabold text-primary tracking-tight">
              {formatUSD(totales.total)}
            </div>
            <div className="text-xs text-muted-foreground font-medium">{formatVES(totales.total_ves)}</div>
          </div>
        </div>

        {/* Checkout button */}
        <Button
          className={cn(
            "w-full h-12 text-base font-bold tracking-wide transition-all duration-200",
            items.length > 0
              ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(245,176,39,0.3)] hover:shadow-[0_0_28px_rgba(245,176,39,0.5)]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
          disabled={items.length === 0 || loading}
          onClick={handleOpenCheckout}
        >
          <span className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cobrar {items.length > 0 ? formatUSD(totales.total) : ''}
          </span>
        </Button>
      </div>

      {/* ── Checkout Modal ──────────────────────── */}
      <Dialog open={checkoutModalOpen} onOpenChange={setCheckoutModalOpen}>
        <DialogContent className="sm:max-w-[440px] bg-card border-border/50 shadow-2xl overflow-hidden p-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-10 blur-xl"></div>
          
          <div className="p-6 space-y-5">
            {/* ── Encabezado ── */}
            <div>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Procesar Pago
              </DialogTitle>
            </div>

            {/* ── PASO 1: Condición de pago ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                1. Condición de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  type="button"
                  className={cn("h-9", condicionPago === 'CONTADO' && "border-primary text-primary bg-primary/10")}
                  onClick={() => setCondicionPago('CONTADO')}
                >
                  De Contado
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  className={cn("h-9", condicionPago === 'CREDITO' && "border-primary text-primary bg-primary/10")}
                  onClick={() => setCondicionPago('CREDITO')}
                >
                  A Crédito
                </Button>
              </div>
            </div>



            {/* ── Resumen de total con IGTF dinámico ── */}
            <div className={cn(
              "rounded-xl border px-4 py-3 transition-all duration-200",
              aplicaIgtf
                ? "border-orange-500/30 bg-orange-500/5"
                : "border-border/60 bg-secondary/20"
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total a cobrar</p>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-extrabold tracking-tight",
                    aplicaIgtf ? "text-orange-400" : "text-primary"
                  )}>
                    {formatUSD(totales.total)}
                  </div>
                  <div className="text-xs text-muted-foreground">{formatVES(totales.total_ves)}</div>
                </div>
              </div>
            </div>

            {/* ── PASO 2: Pagos ── */}
            <div className="space-y-3 pt-1 border-t border-border/50">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                2. Registrar Pagos
              </label>

              {/* Lista de pagos registrados */}
              {pagos.length > 0 && (
                <div className="space-y-1">
                  <div className="divide-y divide-border/50 rounded-lg border border-border/50 bg-secondary/20">
                    {pagos.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-2.5 text-sm">
                        <span className="font-medium text-foreground truncate max-w-[120px]">{p.metodo.replace('_', ' ')}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary text-right">
                            {formatUSD(p.montoUSD)}
                            {p.metodo !== 'EFECTIVO_USD' && (
                              <span className="block text-[10px] text-muted-foreground -mt-0.5 font-normal">
                                {formatVES(p.montoVES)}
                              </span>
                            )}
                          </span>
                          <button onClick={() => removePago(p.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulario agregar pago */}
              <div className="bg-secondary/30 p-3 rounded-lg border border-border/50 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Método</label>
                    <select
                      className="w-full h-9 rounded-md border border-border bg-card text-xs text-foreground px-2 outline-none focus:ring-1 focus:ring-primary/50"
                      value={pagoMetodoIn}
                      onChange={e => setPagoMetodoIn(e.target.value)}
                    >
                      <option value="EFECTIVO_BS">Efectivo Bs.</option>
                      <option value="EFECTIVO_USD">Efectivo $</option>
                      <option value="PAGO_MOVIL">Pago Móvil</option>
                      <option value="TARJETA_DEBITO">Tarj. Débito</option>
                      <option value="TARJETA_CREDITO">Tarj. Crédito</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Monto</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">
                        {pagoMetodoIn === 'EFECTIVO_USD' ? '$' : 'Bs.'}
                      </span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className={cn("h-9 text-sm", pagoMetodoIn === 'EFECTIVO_USD' ? "pl-6" : "pl-8")}
                        value={pagoMontoIn}
                        onChange={e => setPagoMontoIn(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            const amt = parseFloat(pagoMontoIn)
                            if (amt > 0) {
                              const montoUSD = pagoMetodoIn === 'EFECTIVO_USD' ? amt : amt / tasaBcv
                              const pagadoPrevio = pagos.reduce((acc, p) => acc + p.montoUSD, 0)
                              const faltante = totales.total - pagadoPrevio
                              
                              if (montoUSD > faltante + 0.05) {
                                setErrorMsg(`El pago excede el monto restante (${formatUSD(faltante)}). Revisa el monto o da vuelto.`)
                                return
                              }
                              
                              setErrorMsg(null)
                              let newPagos = [...pagos]
                              if (pagoMetodoIn === 'EFECTIVO_USD') {
                                newPagos.push({ id: crypto.randomUUID(), metodo: pagoMetodoIn, montoUSD: amt, montoVES: amt * tasaBcv })
                                addPago({ metodo: pagoMetodoIn, montoUSD: amt, montoVES: amt * tasaBcv })
                              } else {
                                newPagos.push({ id: crypto.randomUUID(), metodo: pagoMetodoIn, montoUSD: amt / tasaBcv, montoVES: amt })
                                addPago({ metodo: pagoMetodoIn, montoUSD: amt / tasaBcv, montoVES: amt })
                              }
                              
                              const pagadoNuevo = newPagos.reduce((acc, p) => acc + p.montoUSD, 0)
                              if (pagadoNuevo < totales.total) {
                                setCondicionPago('CREDITO')
                              } else {
                                setCondicionPago('CONTADO')
                              }
                              
                              setPagoMontoIn('')
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="secondary" 
                  className="w-full h-8 text-xs font-semibold"
                  onClick={() => {
                    const amt = parseFloat(pagoMontoIn)
                    if (amt > 0) {
                      const montoUSD = pagoMetodoIn === 'EFECTIVO_USD' ? amt : amt / tasaBcv
                      const pagadoPrevio = pagos.reduce((acc, p) => acc + p.montoUSD, 0)
                      const faltante = totales.total - pagadoPrevio
                      
                      if (montoUSD > faltante + 0.05) {
                        setErrorMsg(`El pago excede el monto restante (${formatUSD(faltante)}). Revisa el monto o da vuelto.`)
                        return
                      }
                      
                      setErrorMsg(null)
                      let newPagos = [...pagos]
                      if (pagoMetodoIn === 'EFECTIVO_USD') {
                        newPagos.push({ id: crypto.randomUUID(), metodo: pagoMetodoIn, montoUSD: amt, montoVES: amt * tasaBcv })
                        addPago({ metodo: pagoMetodoIn, montoUSD: amt, montoVES: amt * tasaBcv })
                      } else {
                        newPagos.push({ id: crypto.randomUUID(), metodo: pagoMetodoIn, montoUSD: amt / tasaBcv, montoVES: amt })
                        addPago({ metodo: pagoMetodoIn, montoUSD: amt / tasaBcv, montoVES: amt })
                      }
                      
                      const pagadoNuevo = newPagos.reduce((acc, p) => acc + p.montoUSD, 0)
                      if (pagadoNuevo < totales.total) {
                        setCondicionPago('CREDITO')
                      } else {
                        setCondicionPago('CONTADO')
                      }
                      
                      setPagoMontoIn('')
                    }
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Añadir Pago
                </Button>
              </div>

              {/* Restante */}
              {(() => {
                const pagado = pagos.reduce((acc, p) => acc + p.montoUSD, 0)
                const faltante = totales.total - pagado
                return (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-sm font-medium text-muted-foreground">Restante:</span>
                      <div className="text-right">
                        <span className={cn("text-base font-bold", faltante <= 0.01 ? "text-green-500" : "text-destructive")}>
                          {faltante <= 0.01 ? "✓ Saldado" : formatVES(Math.max(0, faltante * tasaBcv))}
                        </span>
                        {faltante > 0.01 && (
                          <span className="block text-[11px] text-foreground/70 font-medium -mt-0.5">
                            {formatUSD(Math.max(0, faltante))}
                          </span>
                        )}
                      </div>
                    </div>
                    {condicionPago === 'CREDITO' && faltante > 0.01 && (
                      <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-2 text-sm animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-primary font-medium leading-tight text-xs">
                          El saldo restante de <strong>{formatUSD(faltante)}</strong> quedará pendiente y se registrará automáticamente en <strong>Cuentas por Cobrar</strong>.
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <DialogFooter className="sm:justify-between border-none bg-transparent p-0">
              <Button type="button" variant="ghost" onClick={() => setCheckoutModalOpen(false)}>Cancelar</Button>
              <Button
                type="button"
                className="font-bold px-6 shadow-lg shadow-primary/20"
                disabled={loading || (condicionPago === 'CONTADO' && (totales.total - pagos.reduce((a, b) => a + b.montoUSD, 0)) > 0.01)}
                onClick={handleCheckout}
              >
                {loading ? 'Procesando...' : 'Emitir Factura'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
