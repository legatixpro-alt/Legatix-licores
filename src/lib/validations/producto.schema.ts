import { z } from "zod"
import '@/lib/validations/zod-es' // Aplica mensajes de error en español globalmente

export const productoSchema = z.object({
  codigo_sku: z.string({ required_error: 'El código SKU es obligatorio' }).min(1, 'El código SKU es obligatorio'),
  nombre: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional().nullable(),
  categoria_id: z.string().uuid('Seleccione una categoría válida').optional().nullable(),
  proveedor_id: z.string().uuid('Seleccione un proveedor válido').optional().nullable(),
  unidad_medida: z.string({ required_error: 'La unidad de medida es obligatoria' }).min(1, 'La unidad de medida es obligatoria'),
  precio_costo: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El precio costo no puede ser negativo'),
  precio_venta: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El precio venta no puede ser negativo'),
  precio_venta_usd: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El precio USD no puede ser negativo'),
  stock_actual: z.coerce.number({ invalid_type_error: 'Debe ser un número entero' }).int('Debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  stock_minimo: z.coerce.number({ invalid_type_error: 'Debe ser un número entero' }).int('Debe ser un número entero').min(0, 'El stock mínimo no puede ser negativo'),
  volumen_litros: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El volumen en litros no puede ser negativo').optional().nullable(),
  es_licor: z.boolean().default(false),
  es_promo: z.boolean().default(false),
  grado_alcoholico: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0, 'El grado alcohólico no puede ser negativo').max(100, 'El grado máximo es 100').optional().nullable(),
  gravado_iva: z.boolean().default(true),
  alicuota_iva: z.coerce.number({ invalid_type_error: 'Debe ser un número' }).min(0).default(16.00),
  activo: z.boolean().default(true)
}).superRefine((data, ctx) => {
  if (data.es_licor) {
    if (!data.volumen_litros || data.volumen_litros <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El volumen en litros es obligatorio para licores",
        path: ["volumen_litros"]
      })
    }
    if (!data.grado_alcoholico || data.grado_alcoholico <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El % de alcohol es obligatorio para licores",
        path: ["grado_alcoholico"]
      })
    }
  }
})

export type ProductoFormValues = z.infer<typeof productoSchema>
