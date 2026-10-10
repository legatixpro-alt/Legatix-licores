DO $$
DECLARE
  v_emp_record RECORD;
BEGIN
  -- Iterar sobre todas las empresas (por si hay varias de prueba)
  FOR v_emp_record IN SELECT id FROM empresas LOOP
    
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CINC-070', 'Ron Cinco Estrellas Blanco', 'Medida: 0.70 L', 'UNIDAD', 10, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-RUMB-048', 'Ron Rumbaron', 'Medida: 0.485 L', 'UNIDAD', 6, 0.485, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'PRO-RUMB-FIL', 'Ron Rumbaron Promo (Dos botellas un filtro)', 'Medida: 1.0 L', 'UNIDAD', 5, 1, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'ENE-SPEE-310', 'Bebida Energética Speed Máx lata', 'Medida: 310 ml', 'UNIDAD', 34, 0.31, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-COCA-100', 'Refresco Coca-Cola', 'Medida: 1.0 L', 'UNIDAD', 16, 1, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-COCA-150', 'Refresco Coca-Cola', 'Medida: 1.5 L', 'UNIDAD', 5, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-COCA-200', 'Refresco Coca-Cola', 'Medida: 2.0 L', 'UNIDAD', 1, 2, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'ENE-GATO-NAR', 'Bebida Energética Gatorade Naranja', 'Medida: 500 ml', 'UNIDAD', 9, 0.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'ENE-GATO-FRE', 'Bebida Energética Gatorade Fresa', 'Medida: 500 ml', 'UNIDAD', 5, 0.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'CER-POLN-355', 'Cerveza Polar Pilsen Negra', 'Medida: 355 ml', 'UNIDAD', 11, 0.355, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-PEPS-355', 'Refresco Pepsi lata', 'Medida: 355 ml', 'UNIDAD', 46, 0.355, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-MALT-150', 'Malta', 'Medida: 1.5 L', 'UNIDAD', 3, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-TIME-CAJ', 'Cigarrillo Time Silver', 'Medida: Caja', 'UNIDAD', 13, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-CHIM-18G', 'Chimó El Tigrito', 'Medida: 18 g', 'UNIDAD', 36, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-CHIN-150', 'Refresco Golden Chinotto', 'Medida: 1.50 L', 'UNIDAD', 7, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-PEPN-150', 'Refresco Pepsi Negra', 'Medida: 1.50 L', 'UNIDAD', 9, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'WHI-MANA-070', 'Whisky Managers', 'Medida: 0.70 L', 'UNIDAD', 6, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'WHI-MANA-100', 'Whisky Managers', 'Medida: 1.0 L', 'UNIDAD', 2, 1, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'BRA-CHEM-070', 'Brandy Chemineaud', 'Medida: 0.70 L', 'UNIDAD', 6, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'WHI-GRAN-100', 'Whisky Grand Lord', 'Medida: 1.0 L', 'UNIDAD', 3, 1, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CACI-075', 'Ron Cacique 500', 'Medida: 0.75 L', 'UNIDAD', 5, 0.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CACA-075', 'Ron Cacique Añejo Clásico', 'Medida: 0.75 L', 'UNIDAD', 10, 0.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CANB-070', 'Ron Canaima Blanco', 'Medida: 0.70 L', 'UNIDAD', 6, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CAND-070', 'Ron Canaima Dorado', 'Medida: 0.70 L', 'UNIDAD', 4, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CAND-100', 'Ron Canaima Dorado', 'Medida: 1.0 L', 'UNIDAD', 4, 1, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-CINC-100', 'Ron Cinco Estrellas Blanco', 'Medida: 1.0 L', 'UNIDAD', 12, 1, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VOD-STAN-075', 'Vodka Stanislaff Blanco', 'Medida: 0.75 L', 'UNIDAD', 4, 0.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VIN-CART-175', 'Sangría Caroreña Vino Tinto', 'Medida: 1.75 L', 'UNIDAD', 5, 1.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VIN-CARR-175', 'Sangría Caroreña Rosada', 'Medida: 1.75 L', 'UNIDAD', 6, 1.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VIN-CARB-175', 'Sangría Caroreña Blanca', 'Medida: 1.75 L', 'UNIDAD', 2, 1.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-MINA-150', 'Agua Minalba', 'Medida: 1.50 L', 'UNIDAD', 10, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-MINA-600', 'Agua Minalba', 'Medida: 600 ml', 'UNIDAD', 23, 0.6, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-MINA-355', 'Agua Minalba', 'Medida: 355 ml', 'UNIDAD', 23, 0.355, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-JUGV-150', 'Jugos del Valle Fresh', 'Medida: 1.50 L', 'UNIDAD', 28, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-FRES-150', 'Refresco Golden Frescolita', 'Medida: 1.50 L', 'UNIDAD', 9, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-GUVA-150', 'Refresco Golden Uva', 'Medida: 1.50 L', 'UNIDAD', 7, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-GPIN-150', 'Refresco Golden Piña', 'Medida: 1.50 L', 'UNIDAD', 11, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-GNAR-150', 'Refresco Golden Naranja', 'Medida: 1.50 L', 'UNIDAD', 5, 1.5, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-7UP-355', 'Refresco 7Up lata', 'Medida: 355 ml', 'UNIDAD', 27, 0.355, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'CER-POLP-250', 'Cerveza Polar Pilsen lata', 'Medida: 250 ml', 'UNIDAD', 61, 0.25, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VIN-CARV-250', 'Caroreña Verano lata', 'Medida: 250 ml', 'UNIDAD', 44, 0.25, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'CER-SOLV-250', 'Solera Verde lata', 'Medida: 250 ml', 'UNIDAD', 42, 0.25, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VIN-MANB-175', 'Sangría Blanca La Que Manda', 'Medida: 1.75 L', 'UNIDAD', 3, 1.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VIN-MANR-175', 'Sangría Rosada La Que Manda', 'Medida: 1.75 L', 'UNIDAD', 5, 1.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VOD-GLAG-070', 'Vodka Glacial Guaraná', 'Medida: 0.70 L', 'UNIDAD', 6, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'VOD-GLAT-070', 'Vodka Glacial Tropical Mix', 'Medida: 0.70 L', 'UNIDAD', 6, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'RON-NAIG-070', 'Ron Naiguatá Coconut Tropical', 'Medida: 0.70 L', 'UNIDAD', 5, 0.7, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-TRIM-015', 'Chiclet Trident Menta', 'Medida: 1.5 g', 'UNIDAD', 34, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-TRIS-015', 'Chiclet Trident Sandía', 'Medida: 1.5 g', 'UNIDAD', 60, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-BONB-UND', 'Chupeta Bon Bon Bum Fresa', 'Medida: Unidad', 'UNIDAD', 67, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-COCO-900', 'Cocosette Clásico', 'Medida: 900 g', 'UNIDAD', 4, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-CHES-050', 'Cheese Tris Clásico', 'Medida: 50 g', 'UNIDAD', 17, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-DORI-045', 'Doritos Mundial', 'Medida: 45 g', 'UNIDAD', 15, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-RUFF-122', 'Ruffles Crema y Cebolla', 'Medida: 122 g', 'UNIDAD', 6, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-CHES-150', 'Cheese Tris Clásico', 'Medida: 150 g', 'UNIDAD', 4, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-PEPI-025', 'Pepito Clásico', 'Medida: 25 g', 'UNIDAD', 34, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-CHIC-020', 'Chicharrón Picante', 'Medida: 20 g', 'UNIDAD', 2, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'SNK-CHES-450', 'Cheese Tris Clásico', 'Medida: 450 g', 'UNIDAD', 1, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'MIX-VASO-22Z', 'Vasos Plásticos (Paquetes)', 'Medida: 22 oz', 'UNIDAD', 20, NULL, false, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'WHI-BUCH-075', 'Whisky Buchanan''s 12 Años', 'Medida: 0.75 L', 'UNIDAD', 2, 0.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;
    INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd, activo)
    VALUES (v_emp_record.id, 'WHI-OLDP-075', 'Whisky Old Parr 12 Años', 'Medida: 0.75 L', 'UNIDAD', 2, 0.75, true, 0, 0, 0, true)
    ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
    SET stock_actual = EXCLUDED.stock_actual, activo = true;

  END LOOP;
END $$;
