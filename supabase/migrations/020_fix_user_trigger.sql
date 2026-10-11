
-- Corrige el trigger de creacion de usuarios para permitir invitar usuarios a empresas existentes

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $
DECLARE
  v_empresa_id UUID;
  v_rol TEXT;
BEGIN
  -- Si el usuario viene con metadata de empresa (creado desde el panel de admin)
  IF NEW.raw_user_meta_data->>'empresa_id' IS NOT NULL THEN
    v_empresa_id := (NEW.raw_user_meta_data->>'empresa_id')::UUID;
    v_rol := COALESCE(NEW.raw_user_meta_data->>'rol', 'cajero');
    
    INSERT INTO public.usuarios (id, empresa_id, email, nombre_completo, rol)
    VALUES (
      NEW.id, 
      v_empresa_id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.email), 
      v_rol::user_role
    );
    
    RETURN NEW;
  END IF;

  -- Si es un registro autonomo (nueva cuenta principal)
  INSERT INTO public.empresas (rif, razon_social, direccion_fiscal)
  VALUES ('J-' || floor(random() * 90000000 + 10000000)::text || '-0', 'Empresa de ' || NEW.email, 'Sin direccion definida')
  RETURNING id INTO v_empresa_id;

  INSERT INTO public.usuarios (id, empresa_id, email, nombre_completo, rol)
  VALUES (NEW.id, v_empresa_id, NEW.email, NEW.email, 'admin');
  
  RETURN NEW;
END;
$;
