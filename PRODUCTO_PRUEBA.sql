-- ==============================================================================
-- PRODUCTO DE PRUEBA PARA FACTURACIÓN (TODAS LAS EMPRESAS)
-- ==============================================================================

DO $$
DECLARE
  empresa RECORD;
BEGIN

  -- Recorrer todas las empresas y asegurar que tengan el producto
  FOR empresa IN SELECT id FROM public.empresas LOOP

    INSERT INTO public.productos (
      empresa_id,
      codigo_sku,
      nombre,
      descripcion,
      unidad_medida,
      precio_costo,
      precio_venta,
      precio_venta_usd,
      stock_actual,
      stock_minimo,
      es_licor,
      volumen_litros,
      grado_alcoholico,
      gravado_iva,
      alicuota_iva,
      activo
    ) VALUES (
      empresa.id,
      'LIC-001',
      'Vino Tinto Reserva (750ml)',
      'Vino tinto de reserva, cosecha nacional',
      'BOTELLA',
      8.50,           -- Precio costo en VES 
      15.00,          -- Precio venta en VES 
      5.00,           -- Precio venta en USD
      50,             -- Stock inicial
      5,              -- Stock mínimo
      true,           -- Es licor
      0.75,           -- 750 ml = 0.75 litros
      12.5,           -- 12.5% de alcohol
      true,           -- Gravado con IVA
      16.00,          -- Alícuota IVA 16%
      true            -- Activo
    )
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE SET
      nombre = EXCLUDED.nombre,
      precio_venta_usd = EXCLUDED.precio_venta_usd,
      stock_actual = 50, -- Forzar que haya stock
      activo = true;

  END LOOP;

END;
$$;
