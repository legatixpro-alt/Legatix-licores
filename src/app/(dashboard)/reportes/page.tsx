import { getCurrentUser } from '@/lib/supabase/user-context'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, FileText, BarChart3, PieChart } from 'lucide-react'

export const metadata = {
  title: 'Reportes — Legatix POS',
}

export default async function ReportesPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Centro de Reportes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Genera reportes administrativos, fiscales y analíticos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Reporte de Cierre Diario */}
        <Link href="/reportes/cierre-diario" className="group">
          <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md transition-colors hover:border-primary/50 hover:bg-primary/5">
            <CardHeader className="p-6 sm:p-8">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                Cierre de Caja Diario
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-2 text-muted-foreground">
                Resumen de ventas, desglose por métodos de pago, control de inventario y alertas de stock del día.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {/* Libro de Ventas */}
        <Link href="/reportes/libro-ventas" className="group">
          <Card className="h-full bg-black/40 border-white/10 backdrop-blur-md transition-colors hover:border-primary/50 hover:bg-primary/5">
            <CardHeader className="p-6 sm:p-8">
              <BookOpen className="h-8 w-8 text-blue-500 mb-3" />
              <CardTitle className="text-xl text-foreground group-hover:text-primary transition-colors">
                Libro de Ventas (SENIAT)
              </CardTitle>
              <CardDescription className="text-sm leading-relaxed mt-2 text-muted-foreground">
                Libro contable obligatorio bajo el formato exigido por la providencia administrativa.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
