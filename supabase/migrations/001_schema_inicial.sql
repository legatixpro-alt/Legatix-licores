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
