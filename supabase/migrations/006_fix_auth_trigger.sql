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
