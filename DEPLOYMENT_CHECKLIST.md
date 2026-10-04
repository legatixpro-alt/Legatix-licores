# Guía de Despliegue y Validación (Legatix POS)

## 1. Configuración de Base de Datos (Supabase)

Asegúrate de ejecutar todas las migraciones en orden en tu entorno de producción de Supabase (SQL Editor):
- `001_initial_schema.sql`
- `002_facturacion.sql`
- `003_inventario.sql`
- `004_kardex_triggers.sql`
- `005_emitir_factura_pos_rpc.sql`

*Importante:* Verifica que las políticas RLS están activas en todas las tablas para garantizar que cada empresa solo ve su propia data.

## 2. Variables de Entorno

En tu plataforma de despliegue (Vercel, Netlify, Railway, etc.), configura las siguientes variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-id-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
NEXT_PUBLIC_APP_URL=https://tudominio.com
```

## 3. Checklist Contable y Fiscal antes de Producción

Dado que el software maneja facturación (Providencia Administrativa SENIAT 00071/2011), debes validar lo siguiente junto a tu contador:

- [ ] **Configuración Fiscal:** Ir a *Configuración Fiscal* en el sistema y asegurar que los porcentajes (IVA General, IVA Licores, IGTF) están al día.
- [ ] **Tasa BCV:** Asegurarse de instruir al personal que la tasa BCV debe ser ingresada al inicio del turno para reflejar los cobros en divisas.
- [ ] **Impresora:** Verificar que la impresora térmica (Formatos o Formas Libres) se ajusta al formato Carta o Ticket de `FacturaPDF`.
- [ ] **Libro de Ventas:** Generar un libro de ventas de prueba (CSV) y enviarlo al contador para que confirme que tiene las columnas exactas requeridas para la declaración.

## 4. Auditoría de Rendimiento (Lighthouse)

El frontend está desarrollado con Next.js App Router y SSR/RSC, por lo que el SEO y el Performance base es >90.
Asegúrate de:
- Correr `npm run build` en Vercel para optimizar imágenes y scripts.
- Mantener paginación en inventarios extremadamente largos.

## 5. Accesibilidad (PWA/Responsive)

- El POS (`/pos`) está diseñado primordialmente para tablets y monitores de escritorio (por la cuadrícula de productos y el carrito lateral).
- El resto del panel (Inventario, Clientes, Reportes) es 100% responsivo para móviles.

---
**¡Todo listo para arrancar ventas!**
