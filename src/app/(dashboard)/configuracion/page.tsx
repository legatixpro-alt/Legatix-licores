import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user-context'
import { createClient } from '@/lib/supabase/server'
import { ConfigFiscalForm } from '@/components/configuracion/ConfigFiscalForm'
import { Settings } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Configuración Fiscal — Legatix POS',
}

export default async function ConfiguracionPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  if (user.rol !== 'admin') {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No tienes permisos para ver esta página.
      </div>
    )
  }

  const supabase = createClient()

  const [{ data: configFiscal }, { data: empresa }] = await Promise.all([
    supabase
      .from('config_fiscal')
      .select('*')
      .eq('empresa_id', user.empresa_id)
      .maybeSingle(),
    supabase
      .from('empresas')
      .select('*')
      .eq('id', user.empresa_id)
      .maybeSingle(),
  ])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary drop-shadow-sm" />
          Configuración Fiscal y Empresa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestione los datos fiscales de su negocio, alícuotas de impuestos, talonarios y pie de página de notas de entrega.
        </p>
      </div>

      <ConfigFiscalForm configInicial={configFiscal || null} empresaInicial={empresa || null} />
    </div>
  )
}
