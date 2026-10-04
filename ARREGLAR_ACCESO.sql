-- ==============================================================================
-- SOLUCIÓN DEFINITIVA PARA EL "ERROR DE CONFIGURACIÓN"
-- Ejecuta este script en Supabase > SQL Editor > New Query
-- ==============================================================================

-- 1. Eliminar las políticas anteriores que causan "Recursión Infinita" (Bucle) y bloquean el acceso
DROP POLICY IF EXISTS "Usuarios ven usuarios de su empresa" ON public.usuarios;
DROP POLICY IF EXISTS "Usuarios ven su propia empresa" ON public.empresas;

-- 2. Crear una política limpia y segura para la tabla de usuarios
CREATE POLICY "Permitir ver perfil propio" 
ON public.usuarios 
FOR SELECT 
USING (id = auth.uid());

-- 3. Crear una política para que el usuario pueda leer su empresa
CREATE POLICY "Permitir ver su propia empresa" 
ON public.empresas 
FOR SELECT 
USING (
  id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- (Opcional) Limpiar cualquier usuario extra problemático (si existiera)
-- No se recomienda borrar 'admin@prueba.com' porque ya está perfecto, 
-- pero garantizamos que ahora la aplicación SÍ lo pueda leer.
