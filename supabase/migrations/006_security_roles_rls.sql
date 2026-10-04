-- Migración 006: Roles y Seguridad (RBAC y Hardening)

-- 1. Promover al usuario administrador por defecto (usando los enums existentes 'admin')
UPDATE usuarios SET rol = 'admin' WHERE email = 'admin@prueba.com';

-- 2. Asegurar RLS en tablas de configuración y cajas
ALTER TABLE config_fiscal ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'config_fiscal' AND policyname = 'Acceso a config_fiscal por empresa'
  ) THEN
      CREATE POLICY "Acceso a config_fiscal por empresa" ON config_fiscal
        FOR ALL USING (empresa_id IN (
          SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        ));
  END IF;
END$$;



ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'empresas' AND policyname = 'Usuarios ven su propia empresa'
  ) THEN
      CREATE POLICY "Usuarios ven su propia empresa" ON empresas
        FOR SELECT USING (id IN (
          SELECT empresa_id FROM usuarios WHERE id = auth.uid()
        ));
  END IF;
END$$;
