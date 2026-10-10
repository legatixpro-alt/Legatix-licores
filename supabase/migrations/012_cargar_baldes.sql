-- Migración para añadir Baldes de Cerveza como promociones en el inventario
DO $$
DECLARE
  v_emp_record RECORD;
BEGIN
  -- Iterar sobre todas las empresas (asegura que caiga en tu cuenta)
  FOR v_emp_record IN SELECT id FROM empresas LOOP
    
    -- Balde de Polar Pilsen (Lata 250ml)
    INSERT INTO productos (
      empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, 
      volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo, es_promo
    )
    VALUES (
      v_emp_record.id, 
      'PRO-BALD-POLP', 
      'Balde de Cerveza Polar Pilsen (8 unds)', 
      'Incluye 8 Cervezas Polar Pilsen lata 250ml', 
      'UNIDAD', 
      10, -- Stock inicial de ejemplo
      2.0, -- 8 * 0.25L
      true, 0, 0, 0, true, true
    )
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true, es_promo = true;

    -- Balde de Solera Verde (Lata 250ml)
    INSERT INTO productos (
      empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, 
      volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo, es_promo
    )
    VALUES (
      v_emp_record.id, 
      'PRO-BALD-SOLV', 
      'Balde de Solera Verde (8 unds)', 
      'Incluye 8 Cervezas Solera Verde lata 250ml', 
      'UNIDAD', 
      10, 
      2.0, 
      true, 0, 0, 0, true, true
    )
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true, es_promo = true;

    -- Balde de Polar Pilsen Negra (355ml)
    INSERT INTO productos (
      empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, 
      volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo, es_promo
    )
    VALUES (
      v_emp_record.id, 
      'PRO-BALD-POLN', 
      'Balde de Cerveza Polar Negra (8 unds)', 
      'Incluye 8 Cervezas Polar Pilsen Negra 355ml', 
      'UNIDAD', 
      10, 
      2.84, -- 8 * 0.355L
      true, 0, 0, 0, true, true
    )
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true, es_promo = true;

  END LOOP;
END $$;
