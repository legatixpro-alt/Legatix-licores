-- Migración 007: Módulo de Compras (Proveedores) y Cuentas por Pagar

-- Tabla facturas_compras
CREATE TABLE facturas_compras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id) ON DELETE RESTRICT,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  
  numero_factura VARCHAR(50) NOT NULL,
  numero_control VARCHAR(50) NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  
  condicion_pago condicion_pago DEFAULT 'CONTADO',
  estatus VARCHAR(20) DEFAULT 'PENDIENTE', -- PENDIENTE, PAGADA, ANULADA
  
  monto_exento NUMERIC(14,4) DEFAULT 0,
  base_imponible_general NUMERIC(14,4) DEFAULT 0,
  monto_iva_general NUMERIC(14,4) DEFAULT 0,
  base_imponible_adicional NUMERIC(14,4) DEFAULT 0,
  monto_iva_adicional NUMERIC(14,4) DEFAULT 0,
  total_factura NUMERIC(14,4) NOT NULL,
  
  moneda VARCHAR(5) DEFAULT 'VES',
  tasa_bcv NUMERIC(14,4) DEFAULT 1,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(proveedor_id, numero_factura, empresa_id)
);

CREATE TABLE compras_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compra_id UUID NOT NULL REFERENCES facturas_compras(id) ON DELETE CASCADE,
  fecha_pago TIMESTAMPTZ DEFAULT NOW(),
  metodo VARCHAR(50) NOT NULL,
  moneda VARCHAR(5) NOT NULL,
  monto NUMERIC(14,4) NOT NULL,
  referencia VARCHAR(100),
  tasa_bcv NUMERIC(14,4) DEFAULT 1
);

-- RLS
ALTER TABLE facturas_compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_pagos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "facturas_compras select" ON facturas_compras FOR SELECT USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
CREATE POLICY "facturas_compras insert" ON facturas_compras FOR INSERT WITH CHECK (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));
CREATE POLICY "facturas_compras update" ON facturas_compras FOR UPDATE USING (empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "compras_pagos select" ON compras_pagos FOR SELECT USING (compra_id IN (SELECT id FROM facturas_compras WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));
CREATE POLICY "compras_pagos insert" ON compras_pagos FOR INSERT WITH CHECK (compra_id IN (SELECT id FROM facturas_compras WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));
CREATE POLICY "compras_pagos update" ON compras_pagos FOR UPDATE USING (compra_id IN (SELECT id FROM facturas_compras WHERE empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())));
