'use client'

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { FacturaConRelaciones, ConfigFiscal } from '@/types/facturacion.types'
import { formatUSD, formatVES } from '@/lib/fiscal'

// Register font (optional)
// Font.register({ family: 'Inter', src: '...' })

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  header: { borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 10, marginBottom: 15 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  subTitle: { fontSize: 12, textAlign: 'center', marginBottom: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  infoCol: { flex: 1 },
  label: { fontWeight: 'bold' },
  table: { width: '100%', marginTop: 10 },
  tableHeaderRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 5, marginBottom: 5 },
  tableRow: { flexDirection: 'row', marginBottom: 3 },
  colDesc: { width: '40%' },
  colQty: { width: '10%', textAlign: 'center' },
  colPrice: { width: '15%', textAlign: 'right' },
  colIva: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right' },
  totalsArea: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#000', paddingTop: 10, alignSelf: 'flex-end', width: '50%' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  totalLabel: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', fontSize: 8, color: '#666' }
})

export function FacturaPDF({ factura, configFiscal }: { factura: FacturaConRelaciones, configFiscal: ConfigFiscal }) {
  const isConsumidor = !factura.cliente

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Text style={styles.title}>LICORERÍA LEGATIX</Text>
          <Text style={styles.subTitle}>RIF: J-12345678-9</Text>
          <Text style={{ textAlign: 'center', fontSize: 9 }}>Av. Principal, Local 1, Caracas</Text>
        </View>

        {/* Datos Factura */}
        <View style={styles.infoRow}>
          <View style={styles.infoCol}>
            <Text><Text style={styles.label}>Cliente:</Text> {isConsumidor ? 'Consumidor Final' : factura.cliente.razon_social}</Text>
            <Text><Text style={styles.label}>RIF/CI:</Text> {isConsumidor ? 'V-00000000' : factura.cliente.numero_doc}</Text>
            {!isConsumidor && factura.cliente.direccion_fiscal && (
              <Text><Text style={styles.label}>Dirección:</Text> {factura.cliente.direccion_fiscal}</Text>
            )}
          </View>
          <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
            <Text><Text style={styles.label}>{factura.tipo_documento}:</Text> {factura.numero_factura}</Text>
            <Text><Text style={styles.label}>Control:</Text> {factura.numero_control}</Text>
            <Text><Text style={styles.label}>Fecha:</Text> {factura.fecha_emision}</Text>
            <Text><Text style={styles.label}>Moneda:</Text> {factura.moneda_principal} (Tasa: Bs. {factura.tasa_bcv})</Text>
          </View>
        </View>

        {/* Tabla de Items */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.colDesc, styles.label]}>Descripción</Text>
            <Text style={[styles.colQty, styles.label]}>Cant.</Text>
            <Text style={[styles.colPrice, styles.label]}>Precio</Text>
            <Text style={[styles.colIva, styles.label]}>IVA(%)</Text>
            <Text style={[styles.colTotal, styles.label]}>Total</Text>
          </View>
          
          {factura.items?.map((item, idx) => {
            const ivaDisplay = item.tipo_alicuota === 'EXENTO' ? 'E' : 
                               `${item.alicuota_iva_pct}%`;
                               
            return (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.descripcion}</Text>
                <Text style={styles.colQty}>{item.cantidad}</Text>
                <Text style={styles.colPrice}>{formatUSD(item.precio_unitario_usd)}</Text>
                <Text style={styles.colIva}>{ivaDisplay}</Text>
                <Text style={styles.colTotal}>{formatUSD(item.total_usd)}</Text>
              </View>
            )
          })}
        </View>

        {/* Totales */}
        <View style={styles.totalsArea}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>{formatUSD(factura.subtotal_usd)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Base Imponible General:</Text>
            <Text>{formatUSD(factura.base_imponible_general)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>IVA General ({factura.alicuota_iva_general_aplicada}%):</Text>
            <Text>{formatUSD(factura.monto_iva_general)}</Text>
          </View>

          {factura.monto_exento > 0 && (
            <View style={styles.totalRow}>
              <Text>Monto Exento:</Text>
              <Text>{formatUSD(factura.monto_exento)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, { marginTop: 5, borderTopWidth: 1, paddingTop: 5 }]}>
            <Text style={styles.totalLabel}>TOTAL USD:</Text>
            <Text style={styles.totalLabel}>{formatUSD(factura.total_usd)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL VES:</Text>
            <Text style={styles.totalLabel}>{formatVES(factura.total_ves)}</Text>
          </View>
        </View>

        {/* Footer Legal */}
        <View style={styles.footer}>
          <Text>{configFiscal.mensaje_retenciones}</Text>
          {configFiscal.pie_pagina_1 && <Text>{configFiscal.pie_pagina_1}</Text>}
          {configFiscal.pie_pagina_2 && <Text>{configFiscal.pie_pagina_2}</Text>}
        </View>
      </Page>
    </Document>
  )
}
