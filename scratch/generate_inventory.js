const fs = require('fs');

const csvData = `Código SKU;Nombre y Descripción;Medida;Cantidad
RON-CINC-070;Ron Cinco Estrellas Blanco;0.70 L;10
RON-RUMB-048;Ron Rumbaron;0.485 L;6
PRO-RUMB-FIL;Ron Rumbaron Promo (Dos botellas un filtro);1.0 L;5
ENE-SPEE-310;Bebida Energética Speed Máx lata;310 ml;34
MIX-COCA-100;Refresco Coca-Cola;1.0 L;16
MIX-COCA-150;Refresco Coca-Cola;1.5 L;5
MIX-COCA-200;Refresco Coca-Cola;2.0 L;1
ENE-GATO-NAR;Bebida Energética Gatorade Naranja;500 ml;9
ENE-GATO-FRE;Bebida Energética Gatorade Fresa;500 ml;5
CER-POLN-355;Cerveza Polar Pilsen Negra;355 ml;11
MIX-PEPS-355;Refresco Pepsi lata;355 ml;46
MIX-MALT-150;Malta;1.5 L;3
SNK-TIME-CAJ;Cigarrillo Time Silver;Caja;13
SNK-CHIM-18G;Chimó El Tigrito;18 g;36
MIX-CHIN-150;Refresco Golden Chinotto;1.50 L;7
MIX-PEPN-150;Refresco Pepsi Negra;1.50 L;9
WHI-MANA-070;Whisky Managers;0.70 L;6
WHI-MANA-100;Whisky Managers;1.0 L;2
BRA-CHEM-070;Brandy Chemineaud;0.70 L;6
WHI-GRAN-100;Whisky Grand Lord;1.0 L;3
RON-CACI-075;Ron Cacique 500;0.75 L;5
RON-CACA-075;Ron Cacique Añejo Clásico;0.75 L;10
RON-CANB-070;Ron Canaima Blanco;0.70 L;6
RON-CAND-070;Ron Canaima Dorado;0.70 L;4
RON-CAND-100;Ron Canaima Dorado;1.0 L;4
RON-CINC-100;Ron Cinco Estrellas Blanco;1.0 L;12
VOD-STAN-075;Vodka Stanislaff Blanco;0.75 L;4
VIN-CART-175;Sangría Caroreña Vino Tinto;1.75 L;5
VIN-CARR-175;Sangría Caroreña Rosada;1.75 L;6
VIN-CARB-175;Sangría Caroreña Blanca;1.75 L;2
MIX-MINA-150;Agua Minalba;1.50 L;10
MIX-MINA-600;Agua Minalba;600 ml;23
MIX-MINA-355;Agua Minalba;355 ml;23
MIX-JUGV-150;Jugos del Valle Fresh;1.50 L;28
MIX-FRES-150;Refresco Golden Frescolita;1.50 L;9
MIX-GUVA-150;Refresco Golden Uva;1.50 L;7
MIX-GPIN-150;Refresco Golden Piña;1.50 L;11
MIX-GNAR-150;Refresco Golden Naranja;1.50 L;5
MIX-7UP-355;Refresco 7Up lata;355 ml;27
CER-POLP-250;Cerveza Polar Pilsen lata;250 ml;61
VIN-CARV-250;Caroreña Verano lata;250 ml;44
CER-SOLV-250;Solera Verde lata;250 ml;42
VIN-MANB-175;Sangría Blanca La Que Manda;1.75 L;3
VIN-MANR-175;Sangría Rosada La Que Manda;1.75 L;5
VOD-GLAG-070;Vodka Glacial Guaraná;0.70 L;6
VOD-GLAT-070;Vodka Glacial Tropical Mix;0.70 L;6
RON-NAIG-070;Ron Naiguatá Coconut Tropical;0.70 L;5
SNK-TRIM-015;Chiclet Trident Menta;1.5 g;34
SNK-TRIS-015;Chiclet Trident Sandía;1.5 g;60
SNK-BONB-UND;Chupeta Bon Bon Bum Fresa;Unidad;67
SNK-COCO-900;Cocosette Clásico;900 g;4
SNK-CHES-050;Cheese Tris Clásico;50 g;17
SNK-DORI-045;Doritos Mundial;45 g;15
SNK-RUFF-122;Ruffles Crema y Cebolla;122 g;6
SNK-CHES-150;Cheese Tris Clásico;150 g;4
SNK-PEPI-025;Pepito Clásico;25 g;34
SNK-CHIC-020;Chicharrón Picante;20 g;2
SNK-CHES-450;Cheese Tris Clásico;450 g;1
MIX-VASO-22Z;Vasos Plásticos (Paquetes);22 oz;20
WHI-BUCH-075;Whisky Buchanan's 12 Años;0.75 L;2
WHI-OLDP-075;Whisky Old Parr 12 Años;0.75 L;2`;

const lines = csvData.trim().split(/\r?\n/);
lines.shift(); // remove header

let sql = `-- Migración 010: Cargar inventario inicial
DO $$
DECLARE
  v_empresa_id UUID;
BEGIN
  SELECT id INTO v_empresa_id FROM empresas LIMIT 1;
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró empresa para asignar los productos';
  END IF;

`;

for (const line of lines) {
  const [sku, nombre, medida, cantidad] = line.split(';');
  
  let volumen = 'NULL';
  if (medida.toLowerCase().includes(' l')) {
    volumen = parseFloat(medida).toString();
  } else if (medida.toLowerCase().includes('ml')) {
    volumen = (parseFloat(medida) / 1000).toString();
  }

  let esLicor = 'false';
  if (sku.startsWith('RON') || sku.startsWith('WHI') || sku.startsWith('BRA') || sku.startsWith('VOD') || sku.startsWith('CER') || sku.startsWith('VIN') || sku.startsWith('PRO')) {
    esLicor = 'true';
  }

  // Precios se dejan en 0 como indica el usuario (se llenarán manual)
  // alicuota_iva: Asumimos 16.00 general, y si es licor quizás 15.00 adicional (por ahora 16.00)
  
  sql += `  INSERT INTO productos (empresa_id, codigo_sku, nombre, descripcion, unidad_medida, stock_actual, volumen_litros, es_licor, precio_costo, precio_venta, precio_venta_usd)
  VALUES (v_empresa_id, '${sku}', '${nombre.replace(/'/g, "''")}', 'Medida: ${medida}', 'UNIDAD', ${cantidad}, ${volumen}, ${esLicor}, 0, 0, 0)
  ON CONFLICT (empresa_id, codigo_sku) DO UPDATE 
  SET stock_actual = productos.stock_actual + ${cantidad};
  
`;
}

sql += `
END $$;
`;

fs.writeFileSync('./supabase/migrations/010_cargar_inventario.sql', sql, 'utf8');
console.log('Migration generated successfully.');
