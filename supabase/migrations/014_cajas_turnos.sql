CREATE TABLE cajas_turnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) NOT NULL,
  fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_cierre TIMESTAMP WITH TIME ZONE,
  monto_apertura_ves NUMERIC(15, 2) DEFAULT 0,
  monto_apertura_usd NUMERIC(15, 2) DEFAULT 0,
  monto_cierre_ves_sistema NUMERIC(15, 2) DEFAULT 0,
  monto_cierre_usd_sistema NUMERIC(15, 2) DEFAULT 0,
  monto_cierre_ves_declarado NUMERIC(15, 2) DEFAULT 0,
  monto_cierre_usd_declarado NUMERIC(15, 2) DEFAULT 0,
  estatus TEXT CHECK (estatus IN ('ABIERTO', 'CERRADO')) DEFAULT 'ABIERTO',
  observaciones TEXT
);

ALTER TABLE cajas_turnos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas ven sus propios turnos" ON cajas_turnos 
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM usuarios WHERE empresa_id = cajas_turnos.empresa_id
  ));

ALTER TABLE facturas ADD COLUMN turno_id UUID REFERENCES cajas_turnos(id);
