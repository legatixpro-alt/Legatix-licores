'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search, Trash2, AlertCircle,
  Calculator, FileText, User,
  Package, RefreshCw, CheckCircle2, Wine
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type {
  ConfigFiscal, Cliente, TipoAlicuota, MonedaPago,
  CondicionPago, TipoDocumento, CrearItemPayload, CrearPagoPayload
} from '@/types/facturacion.types'
import type { Producto } from '@/types/inventario.types'
import {
  calcularItemFiscal, calcularFacturaFiscal,
  formatUSD, formatVES, monedaActivaIgtf
} from '@/lib/fiscal'
import { getTasaBcv } from '@/app/actions/bcv'
import { cn } from 'cn'

interface Props {
  clientes: Cliente[]
  productos: Producto[]
  configFiscal: ConfigFiscal
  empresaId: string
  userId: string
}

interface ItemFormulario extends CrearItemPayload {
  _id: string // key temporal para React
  _calculo: ReturnType<typeof calcularItemFiscal>
}

export function NuevaFacturaForm({ clientes, productos, configFiscal, empresaId, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  // ── Estado del formulario ─────────────────────────────────
  const [tipoDoc, setTipoDoc]           = useState<TipoDocumento>('FACTURA')
  const [condicion, setCondicion]       = useState<CondicionPago>('CONTADO')
  const [moneda, setMoneda]             = useState<MonedaPago>('USD')
  const [tasaBcv, setTasaBcv]           = useState(configFiscal ? 0 : 36.5)
  const [clienteId, setClienteId]       = useState('')
  const [clienteBusqueda, setClienteBusqueda] = useState('')
  const [mostrarDropCliente, setMostrarDropCliente] = useState(false)
  const [observaciones, setObservaciones] = useState('')
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0])

  // Items
  const [items, setItems] = useState<ItemFormulario[]>([])
  const [productoBusqueda, setProductoBusqueda] = useState('')
  const [mostrarDropProducto, setMostrarDropProducto] = useState(false)

  // Pagos
  const [pagos, setPagos] = useState<CrearPagoPayload[]>([{ moneda: 'USD', monto: 0 }])

  // UI
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [exito, setExito]         = useState(false)
  
  const [isFetchingBcv, setIsFetchingBcv] = useState(false)

  const fetchBcvRate = async () => {
    setIsFetchingBcv(true)
    const res = await getTasaBcv()
    if (res.success && res.tasa) {
      setTasaBcv(res.tasa)
    }
    setIsFetchingBcv(false)
  }

  // Cargar tasa automáticamente al montar si no hay o para asegurar actualización
  useEffect(() => {
    fetchBcvRate()
  }, [])

  // ── IGTF auto-toggle cuando cambia moneda (Eliminado) ──
  const aplicaIgtf = false

  // ── Búsqueda de clientes ──────────────────────────────────
  const clientesFiltrados = useMemo(() =>
    clientes.filter(c =>
      c.razon_social.toLowerCase().includes(clienteBusqueda.toLowerCase()) ||
      c.numero_doc.includes(clienteBusqueda)
    ).slice(0, 8),
    [clientes, clienteBusqueda]
  )

  const clienteSeleccionado = clientes.find(c => c.id === clienteId)

  // ── Búsqueda de productos ─────────────────────────────────
  const productosFiltrados = useMemo(() =>
    productos.filter(p =>
      p.activo &&
      (p.nombre.toLowerCase().includes(productoBusqueda.toLowerCase()) ||
       p.codigo_sku.toLowerCase().includes(productoBusqueda.toLowerCase()))
    ).slice(0, 10),
    [productos, productoBusqueda]
  )

  // ── Agregar ítem desde producto ───────────────────────────
  const agregarProducto = useCallback((producto: Producto) => {
    const esLicor = !!producto.volumen_litros // Asumimos que tiene volumen → licor
    const tipoAlicuota: TipoAlicuota = producto.gravado_iva ? 'GENERAL' : 'EXENTO'

    const itemBase: CrearItemPayload = {
      producto_id: producto.id,
      descripcion: producto.nombre,
      codigo_sku: producto.codigo_sku,
      cantidad: 1,
      unidad_medida: producto.unidad_medida,
      precio_unitario_usd: producto.precio_venta_usd,
      descuento_pct: 0,
      tipo_alicuota: tipoAlicuota,
      aplica_alicuota_adicional: esLicor,
    }

    const calc = calcularItemFiscal(itemBase, configFiscal, tasaBcv)

    setItems(prev => [...prev, {
      ...itemBase,
      _id: crypto.randomUUID(),
      _calculo: calc,
    }])
    setProductoBusqueda('')
    setMostrarDropProducto(false)
  }, [configFiscal, tasaBcv])

  // ── Actualizar ítem ───────────────────────────────────────
  const actualizarItem = useCallback((id: string, cambios: Partial<CrearItemPayload>) => {
    setItems(prev => prev.map(item => {
      if (item._id !== id) return item
      const actualizado = { ...item, ...cambios }
      const calc = calcularItemFiscal(actualizado, configFiscal, tasaBcv)
      return { ...actualizado, _calculo: calc }
    }))
  }, [configFiscal, tasaBcv])

  const eliminarItem = (id: string) => setItems(prev => prev.filter(i => i._id !== id))

  // ── Totales fiscales ──────────────────────────────────────
  const totales = useMemo(() =>
    calcularFacturaFiscal(items, configFiscal, tasaBcv, moneda, aplicaIgtf),
    [items, configFiscal, tasaBcv, moneda, aplicaIgtf]
  )

  // Sync primer pago con total
  useEffect(() => {
    if (pagos.length === 1) {
      setPagos([{ ...pagos[0], monto: totales.total }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totales.total])

  // ── Guardar factura ───────────────────────────────────────
  const handleGuardar = async () => {
    if (!clienteId)      return setError('Debe seleccionar un cliente.')
    if (items.length === 0) return setError('Debe agregar al menos un ítem.')
    if (!tasaBcv || tasaBcv <= 0) return setError('Ingrese la tasa de cambio BCV del día.')

    setError(null)
    setGuardando(true)

    try {
      // 1. Crear factura (número de control lo genera el trigger)
      const facturaPayload = {
        empresa_id:   empresaId,
        cliente_id:   clienteId,
        usuario_id:   userId,
        tipo_documento: tipoDoc,
        numero_control: '',  // trigger lo asigna
        numero_factura:  '',
        condicion_pago:  condicion,
        moneda_principal: moneda,
        tasa_bcv:        tasaBcv,
        fecha_emision:   fechaEmision,
        aplica_igtf:     aplicaIgtf,
        base_igtf:       aplicaIgtf ? totales.total - totales.igtf : 0,
        monto_igtf:      totales.igtf,
        alicuota_igtf_aplicada: configFiscal.alicuota_igtf,
        base_imponible_general:   totales.base_general,
        monto_iva_general:        totales.iva_general,
        base_imponible_adicional: totales.base_adicional,
        monto_iva_adicional:      totales.iva_adicional,
        base_imponible_reducida:  totales.base_reducida,
        monto_iva_reducida:       totales.iva_reducida,
        monto_exento:             totales.exento,
        subtotal_usd:             totales.subtotal,
        total_iva_usd:            totales.total_iva,
        total_usd:                totales.total,
        total_ves:                totales.total_ves,
        alicuota_iva_general_aplicada:   configFiscal.alicuota_iva_general,
        alicuota_iva_adicional_aplicada: configFiscal.alicuota_iva_adicional,
        estatus: 'EMITIDA',
        observaciones: observaciones || null,
      }

      const { data: factura, error: errF } = await supabase
        .from('facturas')
        .insert(facturaPayload)
        .select()
        .single()

      if (errF) throw errF

      // 2. Insertar ítems
      const itemsPayload = items.map((item, idx) => ({
        factura_id:           factura.id,
        producto_id:          item.producto_id ?? null,
        descripcion:          item.descripcion,
        codigo_sku:           item.codigo_sku ?? null,
        cantidad:             item.cantidad,
        unidad_medida:        item.unidad_medida,
        precio_unitario_usd:  item.precio_unitario_usd,
        precio_unitario_ves:  item._calculo.precio_unitario_ves,
        descuento_pct:        item.descuento_pct,
        monto_descuento_usd:  item._calculo.monto_descuento_usd,
        subtotal_usd:         item._calculo.subtotal_usd,
        tipo_alicuota:        item.tipo_alicuota,
        alicuota_iva_pct:     item._calculo.alicuota_iva_pct,
        monto_iva_usd:        item._calculo.monto_iva_usd,
        total_usd:            item._calculo.total_usd,
        aplica_alicuota_adicional: item.aplica_alicuota_adicional,
        alicuota_adicional_pct:    item._calculo.alicuota_adicional_pct,
        monto_iva_adicional_usd:   item._calculo.monto_iva_adicional_usd,
        orden: idx + 1,
      }))

      const { error: errI } = await supabase.from('facturas_items').insert(itemsPayload)
      if (errI) throw errI

      // 3. Insertar pagos
      const pagosValidos = pagos.filter(p => p.monto > 0)
      if (pagosValidos.length > 0) {
        const pagosPayload = pagosValidos.map(p => ({
          factura_id: factura.id,
          moneda: p.moneda,
          monto: p.monto,
          referencia: p.referencia ?? null,
        }))
        const { error: errP } = await supabase.from('facturas_pagos').insert(pagosPayload)
        if (errP) throw errP
      }

      setExito(true)
      setTimeout(() => router.push(`/facturacion/${factura.id}`), 1200)
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err.message || 'Error al guardar la factura.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Nueva Factura</h2>
          <p className="text-sm text-gray-500">
            Alícuota Aplicada — IVA General: <strong>{configFiscal.alicuota_iva_general}%</strong>
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
      </div>

      {exito && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4 text-green-800">
          <CheckCircle2 className="h-5 w-5" />
          <span className="font-medium">¡Factura emitida correctamente! Redirigiendo...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Columna izquierda (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Tipo de documento y condiciones */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Tipo de Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-500">Documento</Label>
                <select
                  value={tipoDoc}
                  onChange={e => setTipoDoc(e.target.value as TipoDocumento)}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FACTURA">Factura</option>
                  <option value="NOTA_CREDITO">Nota de Crédito</option>
                  <option value="NOTA_DEBITO">Nota de Débito</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Condición de Pago</Label>
                <select
                  value={condicion}
                  onChange={e => setCondicion(e.target.value as CondicionPago)}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO">Crédito</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Moneda Principal</Label>
                <select
                  value={moneda}
                  onChange={e => setMoneda(e.target.value as MonedaPago)}
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="USD">USD — Dólar</option>
                  <option value="VES">VES — Bolívar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="COP">COP — Peso</option>
                  <option value="USDT">USDT — Cripto</option>
                  <option value="MIXTO">Mixto</option>
                </select>
              </div>
              <div>
                <Label className="text-xs text-gray-500">Fecha de Emisión</Label>
                <Input
                  type="date"
                  value={fechaEmision}
                  onChange={e => setFechaEmision(e.target.value)}
                  className="mt-1 h-9 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 flex items-center gap-1.5">
                  Tasa BCV (Bs./USD) *
                  <button
                    type="button"
                    onClick={fetchBcvRate}
                    disabled={isFetchingBcv}
                    className="p-1 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                    title="Actualizar Tasa BCV Oficial"
                  >
                    <RefreshCw className={cn("h-3 w-3", isFetchingBcv && "animate-spin")} />
                  </button>
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={tasaBcv || ''}
                  onChange={e => setTasaBcv(parseFloat(e.target.value) || 0)}
                  placeholder="Ej: 36.8500"
                  className="mt-1 h-9 text-sm"
                />
              </div>

            </CardContent>
          </Card>

          {/* Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Datos del Adquirente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar cliente por nombre o RIF..."
                    className="pl-9 h-9 text-sm"
                    value={clienteSeleccionado ? clienteSeleccionado.razon_social : clienteBusqueda}
                    onChange={e => {
                      setClienteBusqueda(e.target.value)
                      setClienteId('')
                      setMostrarDropCliente(true)
                    }}
                    onFocus={() => setMostrarDropCliente(true)}
                    onBlur={() => setTimeout(() => setMostrarDropCliente(false), 200)}
                  />
                </div>

                {mostrarDropCliente && clientesFiltrados.length > 0 && !clienteSeleccionado && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-xl">
                    {clientesFiltrados.map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0"
                        onMouseDown={() => { setClienteId(c.id); setClienteBusqueda(''); setMostrarDropCliente(false) }}
                      >
                        <p className="font-medium text-sm text-gray-900">{c.razon_social}</p>
                        <p className="text-xs text-gray-500">{c.tipo_doc}-{c.numero_doc} · {c.direccion_fiscal ?? '—'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {clienteSeleccionado && (
                <div className="mt-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div><span className="text-gray-500 text-xs">Nombre:</span><p className="font-semibold text-gray-900">{clienteSeleccionado.razon_social}</p></div>
                    <div><span className="text-gray-500 text-xs">RIF/CI:</span><p className="font-semibold text-gray-900">{clienteSeleccionado.tipo_doc}-{clienteSeleccionado.numero_doc}</p></div>
                    {clienteSeleccionado.direccion_fiscal && (
                      <div className="col-span-2"><span className="text-gray-500 text-xs">Dirección:</span><p className="text-gray-700">{clienteSeleccionado.direccion_fiscal}</p></div>
                    )}
                    {clienteSeleccionado.es_contribuyente_especial && (
                      <div className="col-span-2"><span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⚠ Contribuyente Especial — Aplica retención IVA</span></div>
                    )}
                  </div>
                  <button onClick={() => { setClienteId(''); setClienteBusqueda('') }} className="mt-2 text-xs text-blue-600 hover:underline">Cambiar cliente</button>
                </div>
              )}

              {!clienteSeleccionado && (
                <p className="mt-2 text-xs text-gray-400">
                  ¿Cliente nuevo?{' '}
                  <button className="text-blue-600 hover:underline" onClick={() => window.open('/clientes/nuevo', '_blank')}>
                    Crear aquí
                  </button>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ítems */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Descripción de Bienes y Servicios
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Buscador de productos */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar producto por nombre o código SKU..."
                    className="pl-9 h-9 text-sm"
                    value={productoBusqueda}
                    onChange={e => { setProductoBusqueda(e.target.value); setMostrarDropProducto(true) }}
                    onFocus={() => setMostrarDropProducto(true)}
                    onBlur={() => setTimeout(() => setMostrarDropProducto(false), 200)}
                  />
                </div>
                {mostrarDropProducto && productosFiltrados.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-xl max-h-64 overflow-y-auto">
                    {productosFiltrados.map(p => (
                      <button
                        key={p.id}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b last:border-0 flex justify-between items-center"
                        onMouseDown={() => agregarProducto(p)}
                      >
                        <div>
                          <p className="font-medium text-sm">{p.nombre}</p>
                          <p className="text-xs text-gray-400">{p.codigo_sku}{p.volumen_litros ? ` · ${p.volumen_litros}L` : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-blue-700">{formatUSD(p.precio_venta_usd)}</p>
                          {p.volumen_litros && <p className="text-xs text-amber-600 flex items-center gap-1"><Wine className="h-3 w-3"/>Licor</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tabla de ítems */}
              {items.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 font-semibold text-gray-500 w-[30%]">Descripción</th>
                        <th className="text-center px-2 py-2 font-semibold text-gray-500">Cant.</th>
                        <th className="text-right px-2 py-2 font-semibold text-gray-500">P. Unit. USD</th>
                        <th className="text-center px-2 py-2 font-semibold text-gray-500">Alícuota</th>
                        <th className="text-right px-2 py-2 font-semibold text-gray-500">Base Imp.</th>
                        <th className="text-right px-2 py-2 font-semibold text-gray-500">IVA</th>
                        <th className="text-right px-2 py-2 font-semibold text-gray-500">Total</th>
                        <th className="px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {items.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <Input
                              value={item.descripcion}
                              onChange={e => actualizarItem(item._id, { descripcion: e.target.value })}
                              className="h-7 text-xs border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            />
                            {item.codigo_sku && <p className="text-gray-400 text-[10px]">{item.codigo_sku}</p>}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <Input
                              type="number" min="0.001" step="0.001"
                              value={item.cantidad}
                              onChange={e => actualizarItem(item._id, { cantidad: parseFloat(e.target.value) || 1 })}
                              className="h-7 text-xs w-16 text-center"
                            />
                          </td>
                          <td className="px-2 py-2 text-right">
                            <Input
                              type="number" min="0" step="0.0001"
                              value={item.precio_unitario_usd}
                              onChange={e => actualizarItem(item._id, { precio_unitario_usd: parseFloat(e.target.value) || 0 })}
                              className="h-7 text-xs w-24 text-right"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <select
                              value={item.tipo_alicuota}
                              onChange={e => actualizarItem(item._id, { tipo_alicuota: e.target.value as TipoAlicuota })}
                              className="h-7 rounded border border-gray-200 text-xs px-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                            >
                              <option value="GENERAL">General {configFiscal.alicuota_iva_general}%</option>
                              <option value="EXENTO">Exento 0%</option>
                            </select>
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-gray-700">
                            {formatUSD(item._calculo.subtotal_usd)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono text-purple-600">
                            {formatUSD(item._calculo.monto_iva_usd + item._calculo.monto_iva_adicional_usd)}
                          </td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-gray-900">
                            {formatUSD(item._calculo.total_usd)}
                          </td>
                          <td className="px-2 py-2">
                            <button onClick={() => eliminarItem(item._id)} className="text-gray-300 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {items.length === 0 && (
                <div className="rounded-lg border-2 border-dashed border-gray-200 py-10 text-center text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Busque un producto para agregar a la factura</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardContent className="pt-4">
              <Label className="text-xs text-gray-500">Observaciones (opcional)</Label>
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={2}
                placeholder="Nota interna o mensaje en la factura..."
                className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* ── Columna derecha (1/3) — Resumen Fiscal ── */}
        <div className="flex flex-col gap-4">

          {/* Resumen fiscal */}
          <Card className="border-2 border-blue-100 sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4 text-blue-600" />
                Resumen Fiscal
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 text-sm">
              {/* Subtotales por alícuota */}
              <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                {totales.base_general > 0 && (
                  <FilaResumen label={`Base Grav. Gral (${configFiscal.alicuota_iva_general}%)`} valor={formatUSD(totales.base_general)} />
                )}
                {totales.exento > 0 && (
                  <FilaResumen label="Monto Exento" valor={formatUSD(totales.exento)} />
                )}
                <div className="border-t border-gray-200 pt-2">
                  <FilaResumen label="Total Base Imponible" valor={formatUSD(totales.subtotal)} bold />
                </div>
              </div>

              {/* IVA */}
              <div className="rounded-lg bg-purple-50 border border-purple-100 p-3 space-y-1.5">
                {totales.iva_general > 0 && (
                  <FilaResumen label={`IVA General ${configFiscal.alicuota_iva_general}%`} valor={formatUSD(totales.iva_general)} purple />
                )}
                <div className="border-t border-purple-200 pt-1.5">
                  <FilaResumen label="Total IVA" valor={formatUSD(totales.total_iva)} bold purple />
                </div>
              </div>


              {/* TOTAL */}
              <div className="rounded-xl bg-gray-900 text-white p-4 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-medium opacity-80">TOTAL</span>
                  <span className="text-2xl font-bold">{formatUSD(totales.total)}</span>
                </div>
                {tasaBcv > 0 && (
                  <div className="flex justify-between items-baseline opacity-70">
                    <span className="text-xs">Al tipo BCV {tasaBcv.toFixed(4)}</span>
                    <span className="text-sm font-semibold">{formatVES(totales.total_ves)}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-[10px] text-gray-400">
                  N° Control se genera automáticamente al emitir
                </p>
              </div>

              {/* Botón guardar */}
              <Button
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                onClick={handleGuardar}
                disabled={guardando || !clienteId || items.length === 0 || exito}
              >
                {guardando ? (
                  <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Emitiendo...</>
                ) : (
                  <><FileText className="h-4 w-4 mr-2" />Emitir Factura</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Info normativa */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-4 pb-3">
              <p className="text-[11px] text-blue-800 font-semibold mb-1">📋 Normativa SENIAT</p>
              <ul className="text-[10px] text-blue-700 space-y-0.5">
                <li>• Numeración consecutiva única (Art. 13)</li>
                <li>• Bimoneda: USD + Bs. al tipo BCV</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FilaResumen({ label, valor, bold, purple, amber }: {
  label: string; valor: string; bold?: boolean; purple?: boolean; amber?: boolean
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-xs ${purple ? 'text-purple-700' : amber ? 'text-amber-700' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-xs font-mono ${bold ? 'font-bold' : ''} ${purple ? 'text-purple-800' : amber ? 'text-amber-800' : 'text-gray-900'}`}>
        {valor}
      </span>
    </div>
  )
}
