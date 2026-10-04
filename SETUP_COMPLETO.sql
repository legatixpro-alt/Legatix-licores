-- Habilitar extensión pgcrypto para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum para roles de usuario
CREATE TYPE user_role AS ENUM ('admin', 'cajero', 'bodeguero');

-- 1. Tabla empresas
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rif VARCHAR(20) UNIQUE NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  nombre_comercial VARCHAR(255),
  direccion_fiscal TEXT NOT NULL,
  telefono VARCHAR(50),
  email VARCHAR(100),
  numero_imprenta VARCHAR(100),
  providencia_referencia VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla usuarios (perfiles extendidos de auth.users)
CREATE TABLE usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(255) NOT NULL,
  rol user_role DEFAULT 'cajero',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla categorias
CREATE TABLE categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  UNIQUE(empresa_id, nombre)
);

-- 4. Tabla proveedores
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  rif VARCHAR(20) NOT NULL,
  razon_social VARCHAR(255) NOT NULL,
  contacto VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  activo BOOLEAN DEFAULT true,
  UNIQUE(empresa_id, rif)
);

-- 5. Tabla productos
CREATE TABLE productos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  codigo_sku VARCHAR(50) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  unidad_medida VARCHAR(20) DEFAULT 'UNIDAD',
  precio_costo NUMERIC(12, 2) NOT NULL DEFAULT 0,
  precio_venta NUMERIC(12, 2) NOT NULL DEFAULT 0,
  precio_venta_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
  stock_actual INTEGER NOT NULL DEFAULT 0,
  stock_minimo INTEGER NOT NULL DEFAULT 5,
  volumen_litros NUMERIC(8, 3), -- Requerido para impuestos a licores
  gravado_iva BOOLEAN DEFAULT true,
  alicuota_iva NUMERIC(5, 2) DEFAULT 16.00,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(empresa_id, codigo_sku)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
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
-- Migración 003: Ampliación de Inventario y Kardex

-- 1. Ampliación de la tabla productos para licores
ALTER TABLE productos
ADD COLUMN es_licor BOOLEAN DEFAULT false,
ADD COLUMN grado_alcoholico NUMERIC(5, 2);

-- 2. Enumeración de tipos de movimiento de Kardex
CREATE TYPE tipo_movimiento AS ENUM ('entrada', 'salida', 'ajuste', 'merma');

-- 3. Tabla Kardex (Historial de movimientos de inventario)
CREATE TABLE kardex (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT,
  tipo tipo_movimiento NOT NULL,
  cantidad INTEGER NOT NULL,
  stock_anterior INTEGER NOT NULL,
  stock_nuevo INTEGER NOT NULL,
  motivo VARCHAR(255),
  documento_referencia VARCHAR(100), -- Ej: "Factura N° 123", "Recepción N° 45"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE kardex ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para Kardex
CREATE POLICY "Lectura kardex por empresa" ON kardex
  FOR SELECT USING (empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  ));

CREATE POLICY "Inserción kardex por empresa" ON kardex
  FOR INSERT WITH CHECK (empresa_id IN (
    SELECT empresa_id FROM usuarios WHERE id = auth.uid()
  ));
-- Migración 004: Triggers de Kardex y Control de Stock

CREATE OR REPLACE FUNCTION registrar_movimiento_kardex()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_actual INTEGER;
  v_stock_nuevo INTEGER;
BEGIN
  -- Bloquear la fila del producto para evitar race conditions y obtener stock real
  SELECT stock_actual INTO v_stock_actual
  FROM productos
  WHERE id = NEW.producto_id
  FOR UPDATE;

  -- Calcular el nuevo stock basado en el tipo de movimiento
  -- Se asume que NEW.cantidad es siempre positivo y nosotros restamos si es salida/merma.
  -- Para 'ajuste', NEW.cantidad puede ser positivo o negativo representando la diferencia.
  IF NEW.tipo = 'entrada' THEN
    v_stock_nuevo := v_stock_actual + ABS(NEW.cantidad);
    NEW.cantidad := ABS(NEW.cantidad);
  ELSIF NEW.tipo = 'salida' OR NEW.tipo = 'merma' THEN
    v_stock_nuevo := v_stock_actual - ABS(NEW.cantidad);
    NEW.cantidad := -ABS(NEW.cantidad); -- Guardamos como negativo en kardex
  ELSIF NEW.tipo = 'ajuste' THEN
    v_stock_nuevo := v_stock_actual + NEW.cantidad;
  END IF;

  -- Asignar los valores calculados al registro de kardex
  NEW.stock_anterior := v_stock_actual;
  NEW.stock_nuevo := v_stock_nuevo;

  -- Actualizar el stock en la tabla principal de productos
  UPDATE productos
  SET stock_actual = v_stock_nuevo,
      updated_at = NOW()
  WHERE id = NEW.producto_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que se ejecuta ANTES de insertar en kardex
DROP TRIGGER IF EXISTS trg_registrar_kardex ON kardex;
CREATE TRIGGER trg_registrar_kardex
BEFORE INSERT ON kardex
FOR EACH ROW
EXECUTE FUNCTION registrar_movimiento_kardex();
-- Migración 005: Función Transaccional para Emitir Factura POS

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
    estatus, observaciones
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
    p_factura->>'observaciones'
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

    -- Si hay producto_id, insertar en Kardex para restar stock
    IF NULLIF(v_item->>'producto_id', '') IS NOT NULL THEN
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
        0, 0 -- Estos los calcula el trigger de kardex
      );
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
-- ==============================================================================
-- FIX: Trigger para crear usuario y empresa automáticamente al registrarse.
-- Y script para arreglar el usuario 'admin@prueba.com' actual.
-- ==============================================================================

-- 1. Crear función que se ejecuta al registrar un nuevo usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  -- Crear una empresa por defecto
  INSERT INTO public.empresas (rif, razon_social, direccion_fiscal)
  VALUES ('J-' || floor(random() * 90000000 + 10000000)::text || '-0', 'Empresa de ' || NEW.email, 'Sin dirección definida')
  RETURNING id INTO v_empresa_id;

  -- Insertarlo en nuestra tabla usuarios
  INSERT INTO public.usuarios (id, empresa_id, email, nombre_completo, rol)
  VALUES (NEW.id, v_empresa_id, NEW.email, NEW.email, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Conectar la función al evento de INSERT en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. ==========================================
-- ARREGLO PARA TU USUARIO ACTUAL:
-- Inserta la empresa y tu usuario que ya creaste.
-- ==========================================

DO $$
DECLARE
  v_empresa_id UUID;
  v_user RECORD;
BEGIN
  -- Solo crear empresa si no hay ninguna
  IF NOT EXISTS (SELECT 1 FROM public.empresas) THEN
    INSERT INTO public.empresas (rif, razon_social, direccion_fiscal)
    VALUES ('J-12345678-9', 'Licorería Legatix', 'Dirección Principal')
    RETURNING id INTO v_empresa_id;
  ELSE
    SELECT id INTO v_empresa_id FROM public.empresas LIMIT 1;
  END IF;

  -- Insertar todos los usuarios de auth.users que no estén en public.usuarios
  FOR v_user IN SELECT * FROM auth.users WHERE id NOT IN (SELECT id FROM public.usuarios) LOOP
    INSERT INTO public.usuarios (id, empresa_id, email, nombre_completo, rol)
    VALUES (v_user.id, v_empresa_id, v_user.email, v_user.email, 'admin');
  END LOOP;
END $$;

-- 4. Habilitar políticas RLS básicas para que puedas leer tus datos
DROP POLICY IF EXISTS "Usuarios ven su propia empresa" ON empresas;
CREATE POLICY "Usuarios ven su propia empresa" ON empresas FOR ALL USING (
  id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Usuarios ven usuarios de su empresa" ON usuarios;
CREATE POLICY "Usuarios ven usuarios de su empresa" ON usuarios FOR ALL USING (
  empresa_id IN (SELECT empresa_id FROM usuarios WHERE id = auth.uid()) OR id = auth.uid()
);
