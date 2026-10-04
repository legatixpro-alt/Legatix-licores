-- Migración: Añadir campo es_promo a la tabla de productos para soportar pestaña de Promociones en el POS

ALTER TABLE public.productos 
ADD COLUMN IF NOT EXISTS es_promo boolean DEFAULT false NOT NULL;
