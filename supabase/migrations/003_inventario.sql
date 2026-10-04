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
