-- =========================================================
-- SCRIPT DE REPARACIÓN: Vincular usuario existente
-- Ejecuta esto en Supabase > SQL Editor > New Query
-- =========================================================

-- Paso 1: Ver qué usuarios existen en auth y cuáles faltan en public
-- (puedes correrlo primero para confirmar)
SELECT 
  au.id,
  au.email,
  u.id as usuario_id,
  u.empresa_id
FROM auth.users au
LEFT JOIN public.usuarios u ON u.id = au.id;

-- Paso 2: Crear empresa para Licorería Legatix (si no existe)
INSERT INTO public.empresas (rif, razon_social, direccion_fiscal, nombre_comercial)
SELECT 'J-12345678-9', 'Licorería Legatix C.A.', 'Dirección Principal, Venezuela', 'Legatix'
WHERE NOT EXISTS (
    SELECT 1 FROM public.empresas WHERE rif = 'J-12345678-9'
);

-- Paso 3: Insertar TODOS los usuarios de auth que no están en public.usuarios
-- (esto arregla tu usuario admin@prueba.com y cualquier otro)
INSERT INTO public.usuarios (id, empresa_id, email, nombre_completo, rol)
SELECT 
  au.id,
  (SELECT id FROM public.empresas LIMIT 1),
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  'admin'
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.usuarios);

-- Paso 4: Crear configuración fiscal por defecto para la empresa
INSERT INTO public.config_fiscal (
  empresa_id,
  alicuota_iva_general,
  alicuota_iva_adicional,
  alicuota_igtf,
  alicuota_iva_reducida,
  prefijo_control
)
SELECT
  e.id,
  16.00,
  15.00,
  3.00,
  8.00,
  '00-'
FROM public.empresas e
WHERE NOT EXISTS (
  SELECT 1 FROM public.config_fiscal cf WHERE cf.empresa_id = e.id
);

-- Paso 5: Verificar resultado final
SELECT 
  u.id,
  u.email,
  u.rol,
  e.razon_social as empresa
FROM public.usuarios u
LEFT JOIN public.empresas e ON e.id = u.empresa_id;
