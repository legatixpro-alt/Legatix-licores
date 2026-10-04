-- Limpieza completa de la Base de Datos para paso a producción

BEGIN;

-- Deshabilitar triggers temporalmente (opcional, TRUNCATE CASCADE lo maneja)
-- Truncar todas las tablas operativas y de catálogo, dejando intactos usuarios, empresas y config_fiscal.

TRUNCATE TABLE 
    facturas_items,
    facturas_pagos,
    facturas,
    kardex,
    productos,
    categorias,
    proveedores,
    clientes
RESTART IDENTITY CASCADE;

COMMIT;
