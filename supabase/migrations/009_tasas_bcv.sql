-- Migración 009: Tasas oficiales del BCV (sincronización diaria)
--
-- Fuente: https://www.bcv.org.ve/estadisticas/indice-de-inversion
--   * Bloque "USD" + "Fecha Valor"  -> fuente 'BCV_OFICIAL'
--   * Tabla "Tipo de Cambio de Venta (Bs / USD)" por fecha -> fuente 'BCV_HISTORICO'
--
-- La tasa es global (no depende de la empresa). La escritura la realiza
-- EXCLUSIVAMENTE el servidor con la service_role key (que omite RLS).
-- Los usuarios autenticados solo pueden leer. Así ningún cajero puede
-- insertar o alterar una tasa desde el navegador.

CREATE TABLE IF NOT EXISTS public.tasas_bcv (
  fecha_valor  DATE           PRIMARY KEY,
  usd          NUMERIC(20, 8) NOT NULL CHECK (usd > 0),
  fuente       TEXT           NOT NULL CHECK (fuente IN ('BCV_OFICIAL', 'BCV_HISTORICO')),
  url_origen   TEXT           NOT NULL,
  obtenida_en  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.tasas_bcv IS 'Tipo de cambio oficial Bs/USD publicado por el BCV, por fecha valor.';
COMMENT ON COLUMN public.tasas_bcv.fecha_valor IS 'Fecha a partir de la cual aplica la tasa (America/Caracas).';
COMMENT ON COLUMN public.tasas_bcv.fuente IS 'BCV_OFICIAL = bloque USD/Fecha Valor; BCV_HISTORICO = tabla del índice de inversión.';

-- Índice para "última sincronización" (MAX(obtenida_en)).
CREATE INDEX IF NOT EXISTS idx_tasas_bcv_obtenida_en ON public.tasas_bcv (obtenida_en DESC);

ALTER TABLE public.tasas_bcv ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'tasas_bcv' AND policyname = 'Lectura de tasas BCV para autenticados'
  ) THEN
    CREATE POLICY "Lectura de tasas BCV para autenticados" ON public.tasas_bcv
      FOR SELECT TO authenticated USING (true);
  END IF;
END$$;

-- Intencionalmente NO se crean políticas INSERT/UPDATE/DELETE:
-- con RLS activo, solo service_role puede escribir.
REVOKE INSERT, UPDATE, DELETE ON public.tasas_bcv FROM anon, authenticated;
