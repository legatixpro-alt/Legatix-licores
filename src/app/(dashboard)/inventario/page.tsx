import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { InventarioClient } from '@/components/inventario/InventarioClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Inventario — Legatix POS',
  description: 'Gestión de productos, categorías y proveedores',
}

export default async function InventarioPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  const { data: productos, error: productosError } = await supabase
    .from('productos')
    .select(`
      *,
      categorias ( nombre ),
      proveedores ( razon_social )
    `)
    .eq('empresa_id', user.empresa_id)
    .order('created_at', { ascending: false })

  if (productosError) {
    console.error('Error al cargar productos:', productosError)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Inventario</h2>
          <p className="text-muted-foreground">
            Gestiona tus productos, categorías y proveedores.
          </p>
        </div>
      </div>

      <InventarioClient
        initialData={productos || []}
        empresaId={user.empresa_id}
      />
    </div>
  )
}
