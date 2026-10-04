import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { LibroVentasClient } from '@/components/reportes/LibroVentasClient'
import { FacturaConRelaciones } from '@/types/facturacion.types'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Libro de Ventas — Legatix POS',
}

export default async function LibroVentasPage({ searchParams }: { searchParams: { mes?: string, anio?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  // Filtro por defecto: Mes actual
  const hoy = new Date()
  const currentMes = (hoy.getMonth() + 1).toString().padStart(2, '0')
  const currentAnio = hoy.getFullYear().toString()

  const mes = searchParams.mes || currentMes
  const anio = searchParams.anio || currentAnio

  const startOfMonth = `${anio}-${mes}-01`
  const lastDay = new Date(Number(anio), Number(mes), 0).getDate()
  const endOfMonth = `${anio}-${mes}-${lastDay}`

  const supabase = createClient()

  const { data: facturas } = await supabase
    .from('facturas')
    .select('*, cliente:clientes(*)')
    .eq('empresa_id', user.empresa_id)
    .gte('fecha_emision', startOfMonth)
    .lte('fecha_emision', endOfMonth)
    .neq('estatus', 'ANULADA')
    .order('numero_control', { ascending: true })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary drop-shadow-sm" />
          Reportes SENIAT
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generación y exportación del Libro de Ventas para declaración de IVA.
        </p>
      </div>

      <LibroVentasClient
        facturas={(facturas || []) as unknown as FacturaConRelaciones[]}
        mes={mes}
        anio={anio}
      />
    </div>
  )
}
