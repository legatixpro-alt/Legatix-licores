-- ============================================================
-- MIGRACIÓN 002: MÓDULO DE FACTURACIÓN
-- Normativa: Providencia SENIAT 00071/2011 y actualizaciones
-- Cumplimiento: Art. 13 – Formatos y Formas Libres
-- ============================================================

-- ─────────────────────────────────────────
-- 1. CONFIGURACIÓN FISCAL DE LA EMPRESA
--    Almacena las alícuotas configurables.
--    NUNCA hardcodeadas — Gaceta Oficial puede cambiarlas.
-- ─────────────────────────────────────────
CREATE TABLE config_fiscal (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id             UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- Alícuotas IVA (Art. 27 LIVA)
  alicuota_iva_general   NUMERIC(5, 2) NOT NULL DEFAULT 16.00,   -- Tasa general actual
  alicuota_iva_adicional NUMERIC(5, 2) NOT NULL DEFAULT 15.00,   -- Adicional para bebidas alcohólicas (configurable)
  alicuota_iva_reducida  NUMERIC(5, 2) NOT NULL DEFAULT 8.00,    -- Alimentos y medicinas (por si aplica)
  -- IGTF (Decreto 4.963 / 5.231)
  alicuota_igtf          NUMERIC(5, 2) NOT NULL DEFAULT 3.00,    -- Operaciones en divisas/criptoactivos
  -- Control de numeración fiscal
  proximo_numero_control INTEGER NOT NULL DEFAULT 1,             -- Numeración control interno
  prefijo_control        VARCHAR(10) NOT NULL DEFAULT '00-',     -- Ej: "00-" → "00-0000001"
  -- Datos para impresión de factura
  pie_pagina_1           TEXT,
  pie_pagina_2           TEXT,
  mensaje_retenciones    TEXT DEFAULT 'Sujeto a retención de IVA según normativa SENIAT vigente.',
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id)
);

-- ─────────────────────────────────────────
-- 2. CLIENTES
--    Datos del adquirente requeridos por SENIAT
-- ─────────────────────────────────────────
CREATE TABLE clientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  -- Identificación fiscal
  tipo_doc        VARCHAR(10) NOT NULL DEFAULT 'RIF',           -- RIF, CI, PASS, NIT, etc.
  numero_doc      VARCHAR(30) NOT NULL,                          -- RIF o Cédula
  razon_social    VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  -- Contacto
  direccion_fiscal TEXT,
  telefono        VARCHAR(50),
  email           VARCHAR(100),
  -- Control
  es_contribuyente_especial BOOLEAN DEFAULT false,
  activo          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, tipo_doc, numero_doc)
);

-- ─────────────────────────────────────────
-- 3. FACTURAS
--    Campos obligatorios Art. 13 Providencia 00071
-- ─────────────────────────────────────────
CREATE TYPE tipo_documento AS ENUM ('FACTURA', 'NOTA_CREDITO', 'NOTA_DEBITO');
CREATE TYPE condicion_pago  AS ENUM ('CONTADO', 'CREDITO');
CREATE TYPE moneda_pago     AS ENUM ('USD', 'VES', 'EUR', 'COP', 'USDT', 'MIXTO');
CREATE TYPE estatus_factura AS ENUM ('BORRADOR', 'EMITIDA', 'ANULADA', 'PAGADA');

CREATE TABLE facturas (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id             UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  cliente_id             UUID NOT NULL REFERENCES clientes(id),
  usuario_id             UUID NOT NULL REFERENCES usuarios(id),

  -- Identificación del documento (Art. 13 literal b)
  tipo_documento         tipo_documento NOT NULL DEFAULT 'FACTURA',
  numero_control         VARCHAR(20) NOT NULL,   -- Ej: "00-0000001" (consecutivo interno)
  numero_factura         VARCHAR(20) NOT NULL,   -- Número visible en la factura

  -- Referencia para notas de crédito/débito (Art. 58 LIVA)
  factura_referencia_id  UUID REFERENCES facturas(id),
  numero_factura_ref     VARCHAR(20),
  fecha_factura_ref      DATE,
  motivo_nota            TEXT,

  -- Fecha de emisión (Art. 13 literal c)
  fecha_emision          DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento      DATE,

  -- Condición de operación (Art. 13 literal l)
  condicion_pago         condicion_pago NOT NULL DEFAULT 'CONTADO',
  moneda_principal       moneda_pago NOT NULL DEFAULT 'USD',

  -- Tasa de cambio BCV del día (obligatorio para bimoneda)
  tasa_bcv               NUMERIC(12, 4) NOT NULL DEFAULT 0,

  -- Base imponible por alícuota
  base_imponible_general   NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monto_iva_general        NUMERIC(14, 2) NOT NULL DEFAULT 0,
  base_imponible_adicional NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monto_iva_adicional      NUMERIC(14, 2) NOT NULL DEFAULT 0,
  base_imponible_reducida  NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monto_iva_reducida       NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monto_exento             NUMERIC(14, 2) NOT NULL DEFAULT 0,

  -- IGTF (3% en operaciones divisas/criptoactivos)
  aplica_igtf              BOOLEAN NOT NULL DEFAULT false,
  base_igtf                NUMERIC(14, 2) NOT NULL DEFAULT 0,
  monto_igtf               NUMERIC(14, 2) NOT NULL DEFAULT 0,
  alicuota_igtf_aplicada   NUMERIC(5, 2) NOT NULL DEFAULT 3.00,

  -- Totales
  subtotal_usd           NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_iva_usd          NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_usd              NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total_ves              NUMERIC(14, 6) NOT NULL DEFAULT 0,

  -- Snapshot de alícuotas vigentes al momento de emisión
  alicuota_iva_general_aplicada   NUMERIC(5, 2) NOT NULL DEFAULT 16.00,
  alicuota_iva_adicional_aplicada NUMERIC(5, 2) NOT NULL DEFAULT 15.00,

  -- Estado y control
  estatus                estatus_factura NOT NULL DEFAULT 'EMITIDA',
  observaciones          TEXT,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(empresa_id, numero_control),
  UNIQUE(empresa_id, numero_factura)
);

-- ─────────────────────────────────────────
-- 4. ÍTEMS DE FACTURA
-- ─────────────────────────────────────────
CREATE TYPE tipo_alicuota_item AS ENUM ('GENERAL', 'ADICIONAL', 'REDUCIDA', 'EXENTO');

CREATE TABLE facturas_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id           UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  producto_id          UUID REFERENCES productos(id) ON DELETE SET NULL,
  descripcion          VARCHAR(255) NOT NULL,
  codigo_sku           VARCHAR(50),
  cantidad             NUMERIC(10, 3) NOT NULL DEFAULT 1,
  unidad_medida        VARCHAR(20) NOT NULL DEFAULT 'UNIDAD',
  precio_unitario_usd  NUMERIC(12, 4) NOT NULL,
  precio_unitario_ves  NUMERIC(12, 4) NOT NULL DEFAULT 0,
  descuento_pct        NUMERIC(5, 2) NOT NULL DEFAULT 0,
  monto_descuento_usd  NUMERIC(12, 4) NOT NULL DEFAULT 0,
  subtotal_usd         NUMERIC(14, 4) NOT NULL,
  tipo_alicuota        tipo_alicuota_item NOT NULL DEFAULT 'GENERAL',
  alicuota_iva_pct     NUMERIC(5, 2) NOT NULL DEFAULT 16.00,
  monto_iva_usd        NUMERIC(14, 4) NOT NULL DEFAULT 0,
  total_usd            NUMERIC(14, 4) NOT NULL,
  aplica_alicuota_adicional BOOLEAN NOT NULL DEFAULT false,
  alicuota_adicional_pct    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  monto_iva_adicional_usd   NUMERIC(14, 4) NOT NULL DEFAULT 0,
  orden                INTEGER NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 5. MÉTODOS DE PAGO DE LA FACTURA
-- ─────────────────────────────────────────
CREATE TABLE facturas_pagos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id  UUID NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  moneda      moneda_pago NOT NULL,
  monto       NUMERIC(14, 4) NOT NULL,
  referencia  VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- 6. LIBRO DE VENTAS (Vista)
--    Alimenta declaración de IVA (Forma 30)
-- ─────────────────────────────────────────
CREATE VIEW libro_ventas AS
SELECT
  f.empresa_id,
  f.fecha_emision,
  f.numero_factura,
  f.numero_control,
  f.tipo_documento,
  c.tipo_doc                          AS tipo_doc_cliente,
  c.numero_doc                        AS rif_cliente,
  c.razon_social                      AS nombre_cliente,
  f.monto_exento,
  f.base_imponible_reducida,
  f.monto_iva_reducida,
  f.base_imponible_general,
  f.monto_iva_general,
  f.base_imponible_adicional,
  f.monto_iva_adicional,
  f.total_iva_usd                     AS total_iva,
  f.aplica_igtf,
  f.monto_igtf,
  f.total_usd,
  f.tasa_bcv,
  f.total_ves,
  f.estatus
FROM facturas f
JOIN clientes c ON c.id = f.cliente_id
WHERE f.estatus != 'ANULADA';

-- ─────────────────────────────────────────
-- 7. ÍNDICES DE RENDIMIENTO
-- ─────────────────────────────────────────
CREATE INDEX idx_facturas_empresa       ON facturas(empresa_id);
CREATE INDEX idx_facturas_fecha         ON facturas(empresa_id, fecha_emision DESC);
CREATE INDEX idx_facturas_cliente       ON facturas(cliente_id);
CREATE INDEX idx_facturas_items_factura ON facturas_items(factura_id);
CREATE INDEX idx_clientes_empresa       ON clientes(empresa_id);
CREATE INDEX idx_clientes_doc          ON clientes(empresa_id, numero_doc);

-- ─────────────────────────────────────────
-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────
ALTER TABLE config_fiscal    ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_pagos   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "config_fiscal_empresa" ON config_fiscal
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "clientes_empresa" ON clientes
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "facturas_empresa" ON facturas
  USING (empresa_id = (SELECT empresa_id FROM usuarios WHERE id = auth.uid()));

CREATE POLICY "facturas_items_empresa" ON facturas_items
  USING (factura_id IN (
    SELECT id FROM facturas WHERE empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  ));

CREATE POLICY "facturas_pagos_empresa" ON facturas_pagos
  USING (factura_id IN (
    SELECT id FROM facturas WHERE empresa_id = (
      SELECT empresa_id FROM usuarios WHERE id = auth.uid()
    )
  ));

-- ─────────────────────────────────────────
-- 9. TRIGGER: Numeración consecutiva automática
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION generar_numero_control()
RETURNS TRIGGER AS $$
DECLARE
  cfg    RECORD;
  num    INTEGER;
  prefijo VARCHAR(10);
BEGIN
  SELECT * INTO cfg FROM config_fiscal WHERE empresa_id = NEW.empresa_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe configuración fiscal para la empresa %', NEW.empresa_id;
  END IF;

  IF NEW.numero_control IS NULL OR NEW.numero_control = '' THEN
    num     := cfg.proximo_numero_control;
    prefijo := cfg.prefijo_control;
    NEW.numero_control := prefijo || LPAD(num::TEXT, 7, '0');
    NEW.numero_factura  := LPAD(num::TEXT, 8, '0');

    UPDATE config_fiscal
    SET    proximo_numero_control = proximo_numero_control + 1,
           updated_at = NOW()
    WHERE  empresa_id = NEW.empresa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_numero_control
  BEFORE INSERT ON facturas
  FOR EACH ROW EXECUTE FUNCTION generar_numero_control();
