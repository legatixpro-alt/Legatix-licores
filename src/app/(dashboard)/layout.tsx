import { getCurrentUser } from '@/lib/supabase/user-context'
import { redirect } from 'next/navigation'
import { LogOut, Home, Box, ShoppingCart, FileText, Settings, BarChart2, Users, Wallet } from 'lucide-react'
import { ReactNode } from 'react'
import { NavItem } from '@/components/layout/NavItem'

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const role = user.rol

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-center gap-3 border-b border-border px-6">
          <div className="animate-coin-spin flex-shrink-0">
            <img src="/logo-legatix.jpg" alt="Legatix Logo" className="h-10 w-10 object-cover rounded-full drop-shadow-[0_0_10px_rgba(245,176,39,0.5)] border-2 border-primary/20" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-sm">
            POS <span className="text-primary">Legatix</span>
          </h2>
        </div>
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto">
          <NavItem href="/dashboard" icon={<Home size={20} />} label="Inicio" />
          
          {(role === 'admin' || role === 'cajero') && (
            <>
              <NavItem href="/pos" icon={<ShoppingCart size={20} />} label="POS" />
              <NavItem href="/facturacion" icon={<FileText size={20} />} label="Facturas" />
              <NavItem href="/clientes" icon={<Users size={20} />} label="Clientes" />
              <NavItem href="/finanzas" icon={<Wallet size={20} />} label="Finanzas" />
            </>
          )}

          {(role === 'admin' || role === 'bodeguero') && (
            <NavItem href="/inventario" icon={<Box size={20} />} label="Inventario" />
          )}

          {(role === 'admin' || role === 'cajero') && (
            <NavItem href="/reportes" icon={<BarChart2 size={20} />} label="Reportes" />
          )}

          {role === 'admin' && (
            <>
              <NavItem href="/usuarios" icon={<Users size={20} />} label="Usuarios" />
              <NavItem href="/configuracion" icon={<Settings size={20} />} label="Configuración" />
            </>
          )}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* Header - Desktop & Mobile */}
        <header className="flex h-16 md:h-20 items-center justify-between border-b border-border bg-card/30 backdrop-blur-md px-4 md:px-6 sticky top-0 z-10">
          
          {/* Título (y logo en móvil) */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex-shrink-0">
              <img src="/logo-legatix.jpg" alt="Legatix Logo" className="h-8 w-8 object-cover rounded-full drop-shadow-[0_0_8px_rgba(245,176,39,0.5)] border border-primary/20" />
            </div>
            <h1 className="text-base md:text-lg font-semibold text-foreground truncate max-w-[150px] md:max-w-none">Panel de Control</h1>
          </div>

          {/* User & Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-[10px] md:text-xs font-bold text-black bg-primary px-2 py-0.5 md:px-3 md:py-1 rounded-full shadow-[0_0_10px_rgba(245,176,39,0.3)] truncate max-w-[80px] md:max-w-none text-center">
              {role.toUpperCase()}
            </span>
            <span className="hidden md:inline-block text-sm text-muted-foreground truncate max-w-[150px]">{user.email}</span>
            <form action="/auth/signout" method="post" className="flex-shrink-0">
              <button className="flex items-center justify-center h-8 w-8 md:h-9 md:w-auto md:px-4 md:py-2 md:gap-2 rounded-md text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20">
                <LogOut size={16} /> <span className="hidden md:inline text-sm font-medium">Salir</span>
              </button>
            </form>
          </div>
        </header>
        
        {/* Main Viewport */}
        {/* Se agrega pb-16 en móvil para evitar que el Bottom Tab Bar tape el contenido */}
        <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6 bg-background">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.2)]">
        <NavItem href="/dashboard" icon={<Home size={20} />} label="Inicio" variant="mobile" />
        
        {(role === 'admin' || role === 'cajero') && (
          <NavItem href="/pos" icon={<ShoppingCart size={20} />} label="POS" variant="mobile" />
        )}
        
        {(role === 'admin' || role === 'bodeguero') && (
          <NavItem href="/inventario" icon={<Box size={20} />} label="Stock" variant="mobile" />
        )}

        {(role === 'admin' || role === 'cajero') && (
          <NavItem href="/facturacion" icon={<FileText size={20} />} label="Facturas" variant="mobile" />
        )}

        {role === 'admin' && (
          <NavItem href="/reportes" icon={<BarChart2 size={20} />} label="Reportes" variant="mobile" />
        )}
      </nav>
    </div>
  )
}
