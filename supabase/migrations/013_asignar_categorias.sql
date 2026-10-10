-- Migración para crear Categorías y asignar los productos automáticamente
DO $$
DECLARE
  v_emp RECORD;
  v_cat_ron UUID;
  v_cat_cerveza UUID;
  v_cat_vodka UUID;
  v_cat_vino UUID;
  v_cat_whisky UUID;
  v_cat_brandy UUID;
  v_cat_refresco UUID;
  v_cat_snack UUID;
  v_cat_energia UUID;
BEGIN
  FOR v_emp IN SELECT id FROM empresas LOOP
    
    -- 1. Crear o recuperar Categorías
    
    -- Ron
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Ron', 'Rones nacionales e importados')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_ron;
    
    -- Cervezas
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Cervezas', 'Cervezas en lata y botella')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_cerveza;

    -- Vodka
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Vodka', 'Vodkas clásicos y saborizados')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_vodka;

    -- Vinos y Sangrías
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Vinos y Sangrías', 'Vinos tintos, blancos, rosados y sangrías')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_vino;

    -- Whisky
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Whisky', 'Whiskys escoceses y licores de whisky')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_whisky;

    -- Brandy / Otros Licores
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Brandy y Otros', 'Brandy, Ginebra, etc.')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_brandy;

    -- Refrescos y Aguas
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Refrescos y Aguas', 'Refrescos, maltas, jugos y aguas')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_refresco;

    -- Snacks
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Snacks', 'Chucherías, papas, galletas y cigarrillos')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_snack;

    -- Bebidas Energéticas
    INSERT INTO categorias (empresa_id, nombre, descripcion) 
    VALUES (v_emp.id, 'Energéticas', 'Bebidas energéticas e isotónicas')
    ON CONFLICT (empresa_id, nombre) DO UPDATE SET activo = true
    RETURNING id INTO v_cat_energia;

    -- 2. Actualizar los productos para que pertenezcan a las categorías correspondientes
    -- Se asignan según las primeras letras del SKU que ya le dimos
    
    UPDATE productos SET categoria_id = v_cat_ron 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'RON-%';
    
    UPDATE productos SET categoria_id = v_cat_cerveza 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'CER-%';
    
    UPDATE productos SET categoria_id = v_cat_vodka 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'VOD-%';
    
    UPDATE productos SET categoria_id = v_cat_vino 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'VIN-%';
    
    UPDATE productos SET categoria_id = v_cat_whisky 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'WHI-%';
    
    UPDATE productos SET categoria_id = v_cat_brandy 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'BRA-%';
    
    UPDATE productos SET categoria_id = v_cat_refresco 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'MIX-%';
    
    UPDATE productos SET categoria_id = v_cat_snack 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'SNK-%';
    
    UPDATE productos SET categoria_id = v_cat_energia 
    WHERE empresa_id = v_emp.id AND codigo_sku LIKE 'ENE-%';

  END LOOP;
END $$;
