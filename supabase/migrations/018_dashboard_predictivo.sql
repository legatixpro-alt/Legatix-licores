
CREATE OR REPLACE FUNCTION obtener_alertas_predictivas(p_empresa_id UUID)
RETURNS TABLE (
  tipo TEXT,
  mensaje TEXT,
  producto_id UUID,
  nombre_producto TEXT,
  dato_numerico NUMERIC
) AS $$
BEGIN
  -- 1. Alerta: Productos estancados (Con stock, sin ventas en los ultimos 30 dias)
  RETURN QUERY
  SELECT 
    'ESTANCADO'::TEXT as tipo,
    'El producto lleva mas de 30 dias sin venderse. Sugerencia: Aplicar promocion o remate.'::TEXT as mensaje,
    p.id as producto_id,
    p.nombre as nombre_producto,
    EXTRACT(DAY FROM (NOW() - COALESCE(MAX(f.fecha_emision)::TIMESTAMP, p.created_at)))::NUMERIC as dato_numerico
  FROM productos p
  LEFT JOIN facturas_items fi ON p.id = fi.producto_id
  LEFT JOIN facturas f ON fi.factura_id = f.id AND f.empresa_id = p.empresa_id
  WHERE p.empresa_id = p_empresa_id 
    AND p.stock_actual > 0
    AND p.activo = true
  GROUP BY p.id, p.nombre, p.stock_actual, p.created_at
  HAVING COALESCE(MAX(f.fecha_emision)::TIMESTAMP, p.created_at) < (NOW() - INTERVAL '30 days')
  ORDER BY dato_numerico DESC
  LIMIT 5;

  -- 2. Alerta: Productos de altísima rotacion proximos a agotarse (se venden mucho y queda poco)
  -- Vendidos en los ultimos 15 dias > stock_actual, y stock_actual < 20
  RETURN QUERY
  SELECT
    'ROTACION_ALTA'::TEXT as tipo,
    'Alta demanda reciente y stock critico. Comprar inventario urgente.'::TEXT as mensaje,
    p.id as producto_id,
    p.nombre as nombre_producto,
    SUM(fi.cantidad)::NUMERIC as dato_numerico
  FROM productos p
  JOIN facturas_items fi ON p.id = fi.producto_id
  JOIN facturas f ON fi.factura_id = f.id
  WHERE p.empresa_id = p_empresa_id
    AND p.activo = true
    AND p.stock_actual > 0 
    AND p.stock_actual <= 20
    AND f.fecha_emision >= (CURRENT_DATE - INTERVAL '15 days')
  GROUP BY p.id, p.nombre, p.stock_actual
  HAVING SUM(fi.cantidad) >= p.stock_actual
  ORDER BY dato_numerico DESC
  LIMIT 5;

END;
$$ LANGUAGE plpgsql;
