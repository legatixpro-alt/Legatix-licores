-- ==============================================================================
-- FIX: POLÍTICAS DE ACCESO PARA INVENTARIO (PRODUCTOS, CATEGORIAS, PROVEEDORES)
-- ==============================================================================

-- 1. Políticas para PRODUCTOS
CREATE POLICY "productos_empresa_select" ON public.productos FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "productos_empresa_insert" ON public.productos FOR INSERT WITH CHECK (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "productos_empresa_update" ON public.productos FOR UPDATE USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "productos_empresa_delete" ON public.productos FOR DELETE USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- 2. Políticas para CATEGORIAS
CREATE POLICY "categorias_empresa_select" ON public.categorias FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "categorias_empresa_insert" ON public.categorias FOR INSERT WITH CHECK (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "categorias_empresa_update" ON public.categorias FOR UPDATE USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "categorias_empresa_delete" ON public.categorias FOR DELETE USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- 3. Políticas para PROVEEDORES
CREATE POLICY "proveedores_empresa_select" ON public.proveedores FOR SELECT USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "proveedores_empresa_insert" ON public.proveedores FOR INSERT WITH CHECK (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "proveedores_empresa_update" ON public.proveedores FOR UPDATE USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);
CREATE POLICY "proveedores_empresa_delete" ON public.proveedores FOR DELETE USING (
  empresa_id IN (SELECT empresa_id FROM public.usuarios WHERE id = auth.uid())
);

-- Habilitar explícitamente el RLS por si acaso
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
