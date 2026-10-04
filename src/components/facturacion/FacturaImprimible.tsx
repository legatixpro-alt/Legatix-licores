'use client'

import { useEffect } from 'react'
import type { FacturaConRelaciones, ConfigFiscal } from '@/types/facturacion.types'
import { formatUSD, formatVES, MONEDA_LABELS } from '@/lib/fiscal'

interface Props {
  factura: FacturaConRelaciones
  empresa: Record<string, string | null | undefined>
  config: ConfigFiscal | null
}

export function FacturaImprimible({ factura, empresa, config }: Props) {
  // Auto-print al cargar
  useEffect(() => {
    const timer = setTimeout(() => window.print(), 500)
    return () => clearTimeout(timer)
  }, [])

  const tipoLabel = {
    FACTURA: 'FACTURA',
    NOTA_CREDITO: 'NOTA DE CRÉDITO',
    NOTA_DEBITO: 'NOTA DE DÉBITO',
  }[factura.tipo_documento]

  const itemsOrdenados = [...factura.items].sort((a, b) => a.orden - b.orden)

  return (
    <>
      {/* Estilos específicos de impresión */}
      <style>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 9pt;
          color: #000;
          background: white;
          width: 80mm;
          margin: 0;
          padding: 0;
        }
        .factura-wrapper {
          width: 100%;
          padding: 2mm 5mm 5mm 5mm;
          box-sizing: border-box;
          margin: 0 auto;
        }
        table { border-collapse: collapse; width: 100%; }
        .items-table th, .items-table td {
          padding: 2px 0;
          text-align: left;
          font-size: 8pt;
          border-bottom: 1px dashed #ccc;
        }
        .items-table th {
          border-bottom: 1px solid #000;
          border-top: 1px solid #000;
        }
        .totales-table td { padding: 2px 0; font-size: 8pt; }
        .total-final td { 
          padding: 4px 0;
          font-weight: bold;
          font-size: 9pt;
          border-top: 1px dashed #000;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        
        .footer-legal {
          font-size: 7pt;
          text-align: center;
          margin-top: 10px;
          border-top: 1px dashed #000;
          padding-top: 5px;
        }
        .print-btn {
          position: fixed; bottom: 20px; right: 20px;
          background: #1d4ed8; color: white;
          border: none; padding: 10px 20px;
          border-radius: 8px; cursor: pointer;
          font-size: 14px; font-weight: bold;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .print-btn:hover { background: #1e40af; }
      `}</style>

      <div className="factura-wrapper">
        {/* ══════════════════════════════════════
            ENCABEZADO — EMISOR + TIPO DOC
        ══════════════════════════════════════ */}
        <div className="center" style={{ marginBottom: '10px' }}>
          <p style={{ fontSize: '11pt', fontWeight: 'bold', margin: '0 0 2px 0' }}>{empresa?.razon_social}</p>
          {empresa?.nombre_comercial && (
            <p style={{ fontSize: '9pt', margin: '0 0 2px 0' }}>{empresa.nombre_comercial}</p>
          )}
          <p style={{ margin: '0 0 2px 0', fontSize: '8pt' }}>RIF: {empresa?.rif}</p>
          <p style={{ margin: '0 0 2px 0', fontSize: '8pt' }}>{empresa?.direccion_fiscal}</p>
          {empresa?.telefono && (
            <p style={{ margin: '0 0 2px 0', fontSize: '8pt' }}>Telf.: {empresa.telefono}</p>
          )}
          
          <hr style={{ borderTop: '1px dashed #000', margin: '8px 0' }} />
          
          <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 2px 0' }}>{tipoLabel}</p>
          <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 2px 0' }}>N° {factura.numero_factura}</p>
          <p style={{ fontSize: '8pt', margin: '0 0 2px 0' }}>Control: {factura.numero_control}</p>
          <p style={{ fontSize: '8pt', margin: '0 0 2px 0' }}>Fecha: {factura.fecha_emision}</p>
        </div>

        <hr style={{ borderTop: '1px dashed #000', margin: '5px 0' }} />

        {/* ══════════════════════════════════════
            DATOS DEL ADQUIRENTE
        ══════════════════════════════════════ */}
        <div style={{ marginBottom: '10px', fontSize: '8pt' }}>
          <p style={{ margin: '2px 0' }}><span className="bold">Cliente:</span> {factura.cliente.razon_social}</p>
          <p style={{ margin: '2px 0' }}><span className="bold">{factura.cliente.tipo_doc}:</span> {factura.cliente.numero_doc}</p>
          {factura.cliente.direccion_fiscal && (
            <p style={{ margin: '2px 0' }}><span className="bold">Dir:</span> {factura.cliente.direccion_fiscal}</p>
          )}
          <p style={{ margin: '2px 0' }}><span className="bold">Condición:</span> {factura.condicion_pago}</p>
          <p style={{ margin: '2px 0' }}><span className="bold">Tasa BCV:</span> Bs. {Number(factura.tasa_bcv).toFixed(4)}</p>
          
          {factura.numero_factura_ref && (
            <p style={{ margin: '4px 0', fontSize: '8pt' }}>
              <span className="bold">Ref:</span> Fact. N° {factura.numero_factura_ref} ({factura.fecha_factura_ref})
            </p>
          )}
        </div>

        {/* ══════════════════════════════════════
            TABLA DE ÍTEMS
        ══════════════════════════════════════ */}
        <table className="items-table" style={{ marginBottom: '10px' }}>
          <thead>
            <tr>
              <th style={{ width: '15%' }}>CANT</th>
              <th style={{ width: '50%' }}>DESCRIPCIÓN</th>
              <th style={{ width: '35%', textAlign: 'right' }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {itemsOrdenados.map(item => (
              <tr key={item.id}>
                <td style={{ verticalAlign: 'top' }}>
                  {Number(item.cantidad).toFixed(item.unidad_medida === 'UNIDAD' ? 0 : 3)}
                </td>
                <td>
                  <span style={{ fontWeight: 'bold' }}>{item.descripcion}</span>
                  <div style={{ fontSize: '7pt', color: '#333' }}>
                    {formatUSD(Number(item.precio_unitario_usd))} c/u
                    {item.tipo_alicuota === 'EXENTO' ? ' (E)' : ` (G)`}
                  </div>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                  {formatUSD(Number(item.total_usd))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ══════════════════════════════════════
            TOTALES FISCALES
        ══════════════════════════════════════ */}
        <div style={{ marginBottom: '10px' }}>
          <table className="totales-table" style={{ width: '100%' }}>
            <tbody>
              {/* Bases imponibles */}
              {Number(factura.base_imponible_general) > 0 && (
                <tr>
                  <td>Base Gravable Gral ({factura.alicuota_iva_general_aplicada}%)</td>
                  <td className="right">{formatUSD(Number(factura.base_imponible_general))}</td>
                </tr>
              )}

              {Number(factura.monto_exento) > 0 && (
                <tr>
                  <td>Monto Exento</td>
                  <td className="right">{formatUSD(Number(factura.monto_exento))}</td>
                </tr>
              )}
              {/* IVA */}
              {Number(factura.monto_iva_general) > 0 && (
                <tr>
                  <td>IVA Gral {factura.alicuota_iva_general_aplicada}%</td>
                  <td className="right bold">{formatUSD(Number(factura.monto_iva_general))}</td>
                </tr>
              )}

              {/* TOTAL FINAL */}
              <tr className="total-final">
                <td style={{ fontSize: '10pt' }}>TOTAL USD</td>
                <td className="right" style={{ fontSize: '11pt' }}>{formatUSD(Number(factura.total_usd))}</td>
              </tr>
              {Number(factura.tasa_bcv) > 0 && (
                <tr>
                  <td style={{ fontSize: '8pt', color: '#555' }}>
                    Tasa BCV {Number(factura.tasa_bcv).toFixed(4)}
                  </td>
                  <td className="right bold" style={{ fontSize: '9pt' }}>
                    {formatVES(Number(factura.total_ves))}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Forma de pago */}
        {factura.pagos.length > 0 && (
          <div style={{ marginBottom: '10px', fontSize: '8pt' }}>
            <p className="bold" style={{ margin: '0 0 2px 0' }}>FORMA DE PAGO</p>
            {factura.pagos.map(p => (
              <div key={p.id}>
                - {p.moneda}: {formatUSD(Number(p.monto))}{p.referencia ? ` (Ref: ${p.referencia})` : ''}
              </div>
            ))}
          </div>
        )}

        {/* Saldo Pendiente (Cuentas por Cobrar) */}
        {(() => {
          const totalPagado = factura.pagos.reduce((acc, p) => acc + Number(p.monto), 0);
          const saldoPendiente = Number(factura.total_usd) - totalPagado;
          if (saldoPendiente > 0.01) {
            return (
              <div style={{ marginBottom: '10px', fontSize: '8pt', border: '1px solid #000', padding: '4px' }}>
                <p className="bold center" style={{ margin: '0 0 2px 0' }}>SALDO PENDIENTE (CRÉDITO)</p>
                <p className="center bold" style={{ fontSize: '10pt', margin: 0 }}>{formatUSD(saldoPendiente)}</p>
              </div>
            );
          }
          return null;
        })()}

        {/* Observaciones */}
        {factura.observaciones && (
          <div style={{ marginBottom: '10px', fontSize: '8pt' }}>
            <span className="bold">Obs:</span> {factura.observaciones}
          </div>
        )}

        {/* Pie legal */}
        <div className="footer-legal">
          <p style={{ margin: '2px 0' }}>
            {config?.pie_pagina_1 ?? `Factura prov. SENIAT SNAT/2011/00071`}
          </p>
          {config?.pie_pagina_2 && <p style={{ margin: '2px 0' }}>{config.pie_pagina_2}</p>}
          <p style={{ margin: '4px 0' }}>
            {config?.mensaje_retenciones ?? 'Sujeto a retención IVA'}
          </p>
          <p style={{ margin: '4px 0', fontSize: '6pt' }}>
            Original al adquirente
          </p>
        </div>
      </div>

      {/* Botón de impresión (no se imprime) */}
      <button
        className="no-print print-btn"
        onClick={() => window.print()}
      >
        🖨️ Imprimir Factura
      </button>
    </>
  )
}
