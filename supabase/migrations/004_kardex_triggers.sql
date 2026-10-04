-- Migración 004: Triggers de Kardex y Control de Stock

CREATE OR REPLACE FUNCTION registrar_movimiento_kardex()
RETURNS TRIGGER AS $$
DECLARE
  v_stock_actual INTEGER;
  v_stock_nuevo INTEGER;
BEGIN
  -- Bloquear la fila del producto para evitar race conditions y obtener stock real
  SELECT stock_actual INTO v_stock_actual
  FROM productos
  WHERE id = NEW.producto_id
  FOR UPDATE;

  -- Calcular el nuevo stock basado en el tipo de movimiento
  -- Se asume que NEW.cantidad es siempre positivo y nosotros restamos si es salida/merma.
  -- Para 'ajuste', NEW.cantidad puede ser positivo o negativo representando la diferencia.
  IF NEW.tipo = 'entrada' THEN
    v_stock_nuevo := v_stock_actual + ABS(NEW.cantidad);
    NEW.cantidad := ABS(NEW.cantidad);
  ELSIF NEW.tipo = 'salida' OR NEW.tipo = 'merma' THEN
    v_stock_nuevo := v_stock_actual - ABS(NEW.cantidad);
    NEW.cantidad := -ABS(NEW.cantidad); -- Guardamos como negativo en kardex
  ELSIF NEW.tipo = 'ajuste' THEN
    v_stock_nuevo := v_stock_actual + NEW.cantidad;
  END IF;

  -- Asignar los valores calculados al registro de kardex
  NEW.stock_anterior := v_stock_actual;
  NEW.stock_nuevo := v_stock_nuevo;

  -- Actualizar el stock en la tabla principal de productos
  UPDATE productos
  SET stock_actual = v_stock_nuevo,
      updated_at = NOW()
  WHERE id = NEW.producto_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger que se ejecuta ANTES de insertar en kardex
DROP TRIGGER IF EXISTS trg_registrar_kardex ON kardex;
CREATE TRIGGER trg_registrar_kardex
BEFORE INSERT ON kardex
FOR EACH ROW
EXECUTE FUNCTION registrar_movimiento_kardex();
