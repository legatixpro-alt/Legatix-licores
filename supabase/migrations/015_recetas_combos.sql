
CREATE TABLE IF NOT EXISTS productos_recetas (
  combo_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  producto_base_id UUID REFERENCES productos(id) ON DELETE CASCADE,
  cantidad NUMERIC(10, 4) NOT NULL,
  PRIMARY KEY (combo_id, producto_base_id)
);

-- Actualizar la funcion de emitir_factura_pos
CREATE OR REPLACE FUNCTION emitir_factura_pos(
  p_factura JSONB,
  p_items JSONB,
  p_pagos JSONB
)
RETURNS UUID AS $$
DECLARE
  v_factura_id UUID;
  v_item JSONB;
  v_pago JSONB;
BEGIN
  -- Insertar la factura
  INSERT INTO facturas (
    empresa_id, cliente_id, usuario_id, tipo_documento,
    condicion_pago, moneda_principal, tasa_bcv, fecha_emision,
    aplica_igtf, base_igtf, monto_igtf, alicuota_igtf_aplicada,
    base_imponible_general, monto_iva_general,
    base_imponible_adicional, monto_iva_adicional,
    base_imponible_reducida, monto_iva_reducida,
    monto_exento, subtotal_usd, total_iva_usd, total_usd, total_ves,
    alicuota_iva_general_aplicada, alicuota_iva_adicional_aplicada,
    estatus, observaciones, turno_id
  )
  SELECT
    (p_factura->>'empresa_id')::UUID,
    NULLIF(p_factura->>'cliente_id', '')::UUID,
    (p_factura->>'usuario_id')::UUID,
    COALESCE(p_factura->>'tipo_documento', 'FACTURA'),
    COALESCE(p_factura->>'condicion_pago', 'CONTADO'),
    COALESCE(p_factura->>'moneda_principal', 'VES'),
    (p_factura->>'tasa_bcv')::NUMERIC,
    (p_factura->>'fecha_emision')::DATE,
    (p_factura->>'aplica_igtf')::BOOLEAN,
    (p_factura->>'base_igtf')::NUMERIC,
    (p_factura->>'monto_igtf')::NUMERIC,
    (p_factura->>'alicuota_igtf_aplicada')::NUMERIC,
    (p_factura->>'base_imponible_general')::NUMERIC,
    (p_factura->>'monto_iva_general')::NUMERIC,
    (p_factura->>'base_imponible_adicional')::NUMERIC,
    (p_factura->>'monto_iva_adicional')::NUMERIC,
    (p_factura->>'base_imponible_reducida')::NUMERIC,
    (p_factura->>'monto_iva_reducida')::NUMERIC,
    (p_factura->>'monto_exento')::NUMERIC,
    (p_factura->>'subtotal_usd')::NUMERIC,
    (p_factura->>'total_iva_usd')::NUMERIC,
    (p_factura->>'total_usd')::NUMERIC,
    (p_factura->>'total_ves')::NUMERIC,
    (p_factura->>'alicuota_iva_general_aplicada')::NUMERIC,
    (p_factura->>'alicuota_iva_adicional_aplicada')::NUMERIC,
    'EMITIDA',
    p_factura->>'observaciones',
    NULLIF(p_factura->>'turno_id', '')::UUID
  RETURNING id INTO v_factura_id;

  -- Insertar Items y Kardex
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO facturas_items (
      factura_id, producto_id, descripcion, codigo_sku, cantidad,
      unidad_medida, precio_unitario_usd, precio_unitario_ves,
      descuento_pct, monto_descuento_usd, subtotal_usd,
      tipo_alicuota, alicuota_iva_pct, monto_iva_usd, total_usd,
      aplica_alicuota_adicional, alicuota_adicional_pct, monto_iva_adicional_usd,
      orden
    )
    VALUES (
      v_factura_id,
      NULLIF(v_item->>'producto_id', '')::UUID,
      v_item->>'descripcion',
      v_item->>'codigo_sku',
      (v_item->>'cantidad')::NUMERIC,
      v_item->>'unidad_medida',
      (v_item->>'precio_unitario_usd')::NUMERIC,
      (v_item->>'precio_unitario_ves')::NUMERIC,
      (v_item->>'descuento_pct')::NUMERIC,
      (v_item->>'monto_descuento_usd')::NUMERIC,
      (v_item->>'subtotal_usd')::NUMERIC,
      v_item->>'tipo_alicuota',
      (v_item->>'alicuota_iva_pct')::NUMERIC,
      (v_item->>'monto_iva_usd')::NUMERIC,
      (v_item->>'total_usd')::NUMERIC,
      (v_item->>'aplica_alicuota_adicional')::BOOLEAN,
      (v_item->>'alicuota_adicional_pct')::NUMERIC,
      (v_item->>'monto_iva_adicional_usd')::NUMERIC,
      (v_item->>'orden')::INTEGER
    );

    IF NULLIF(v_item->>'producto_id', '') IS NOT NULL THEN
      IF EXISTS (SELECT 1 FROM productos_recetas WHERE combo_id = (v_item->>'producto_id')::UUID) THEN
         INSERT INTO kardex (
           empresa_id, producto_id, usuario_id, tipo, cantidad,
           motivo, documento_referencia, stock_anterior, stock_nuevo
         )
         SELECT 
           (p_factura->>'empresa_id')::UUID,
           pr.producto_base_id,
           (p_factura->>'usuario_id')::UUID,
           'salida',
           pr.cantidad * (v_item->>'cantidad')::NUMERIC,
           'Venta POS (Combo)',
           v_factura_id::text,
           0, 0
         FROM productos_recetas pr
         WHERE pr.combo_id = (v_item->>'producto_id')::UUID;
      ELSE
         INSERT INTO kardex (
           empresa_id, producto_id, usuario_id, tipo, cantidad,
           motivo, documento_referencia, stock_anterior, stock_nuevo
         )
         VALUES (
           (p_factura->>'empresa_id')::UUID,
           (v_item->>'producto_id')::UUID,
           (p_factura->>'usuario_id')::UUID,
           'salida',
           (v_item->>'cantidad')::NUMERIC,
           'Venta POS',
           v_factura_id::text,
           0, 0 
         );
      END IF;
    END IF;
  END LOOP;

  -- Insertar Pagos
  FOR v_pago IN SELECT * FROM jsonb_array_elements(p_pagos)
  LOOP
    INSERT INTO facturas_pagos (
      factura_id, moneda, monto, referencia
    )
    VALUES (
      v_factura_id,
      v_pago->>'moneda',
      (v_pago->>'monto')::NUMERIC,
      v_pago->>'referencia'
    );
  END LOOP;

  RETURN v_factura_id;
END;
$$ LANGUAGE plpgsql;

-- Llenar automaticamente las recetas de los baldes
DO $$
DECLARE 
    rec RECORD;
    v_cerveza_base UUID;
BEGIN
    FOR rec IN SELECT id, nombre FROM productos WHERE nombre ILIKE '%balde%' LOOP
        -- Tratar de buscar la cerveza base
        -- Ej: 'Balde de Cerveza Polar Pilsen' -> Buscar 'Polar Pilsen' en la misma empresa
        SELECT id INTO v_cerveza_base FROM productos 
        WHERE rec.nombre ILIKE '%' || nombre || '%' 
        AND id != rec.id 
        AND nombre NOT ILIKE '%balde%'
        LIMIT 1;
        
        IF v_cerveza_base IS NOT NULL THEN
            INSERT INTO productos_recetas (combo_id, producto_base_id, cantidad)
            VALUES (rec.id, v_cerveza_base, 8)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;
