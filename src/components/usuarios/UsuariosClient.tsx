'use client'

import { useState } from 'react'
import { Plus, Search, Shield, User, Power, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createUsuarioAction, toggleUserStatusAction } from '@/app/actions/usuarios'

interface UsuarioInfo {
  id: string
  email: string
  nombre_completo: string
  rol: 'admin' | 'cajero' | 'bodeguero'
  activo: boolean
  created_at: string
}

interface Props {
  usuarios: UsuarioInfo[]
  empresaId: string
}

export function UsuariosClient({ usuarios, empresaId }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [form, setForm] = useState({
    email: '',
    nombre_completo: '',
    rol: 'cajero' as const,
    password: ''
  })

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.email.toLowerCase().includes(busqueda.toLowerCase())
  )

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const res = await createUsuarioAction({
      empresa_id: empresaId,
      ...form
    })

    if (!res.success) {
      setError(res.error || 'Error desconocido')
    } else {
      setMostrarForm(false)
      setForm({ email: '', nombre_completo: '', rol: 'cajero', password: '' })
    }
    setGuardando(false)
  }

  const handleToggleEstado = async (id: string, estadoActual: boolean) => {
    const confirmMessage = estadoActual 
      ? '¿Estás seguro de desactivar este usuario? No podrá ingresar al sistema.'
      : '¿Estás seguro de activar este usuario?'
      
    if (!window.confirm(confirmMessage)) return
    
    await toggleUserStatusAction(id, estadoActual)
  }

  const ROLE_BADGES = {
    admin:     { label: 'Administrador', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    cajero:    { label: 'Cajero',        color: 'bg-blue-100 text-blue-700 border-blue-200' },
    bodeguero: { label: 'Bodeguero',     color: 'bg-amber-100 text-amber-700 border-amber-200' },
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary drop-shadow-sm" />
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Administra los accesos y roles del sistema.</p>
        </div>
        <Button 
          onClick={() => setMostrarForm(!mostrarForm)} 
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,176,39,0.3)] transition-all"
        >
          <Plus className="h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>

      {mostrarForm && (
        <Card className="glass-card border-border/50 bg-card/60 backdrop-blur-xl">
          <CardHeader className="pt-5 pb-4 px-6 border-b border-border/50 bg-secondary/30">
            <CardTitle className="text-sm font-semibold text-primary">Registrar Nuevo Usuario</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <form onSubmit={handleCrearUsuario} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
              <div className="flex flex-col gap-2">
                <Label className="text-[13px] text-muted-foreground ml-1">Nombre Completo *</Label>
                <Input 
                  required
                  value={form.nombre_completo}
                  onChange={e => setForm({...form, nombre_completo: e.target.value})}
                  className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors"
                  placeholder="Ej: Ana Pérez"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[13px] text-muted-foreground ml-1">Correo Electrónico *</Label>
                <Input 
                  required
                  type="email"
                  value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors"
                  placeholder="ana@legatix.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[13px] text-muted-foreground ml-1">Rol de Acceso *</Label>
                <select
                  required
                  value={form.rol}
                  onChange={e => setForm({...form, rol: e.target.value as any})}
                  className="h-11 w-full rounded-md border border-border bg-background/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="cajero" className="bg-card text-foreground">Cajero (Ventas, Clientes)</option>
                  <option value="bodeguero" className="bg-card text-foreground">Bodeguero (Inventario)</option>
                  <option value="admin" className="bg-card text-foreground">Administrador (Acceso Total)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-[13px] text-muted-foreground ml-1">Contraseña (Opcional)</Label>
                <Input 
                  type="password"
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  className="h-11 px-4 bg-background/50 border-border text-foreground focus:border-primary placeholder:text-muted-foreground/40 transition-colors"
                  placeholder="Por defecto: 12345678"
                />
              </div>
              <div className="lg:col-span-4 flex justify-end gap-3 mt-2">
                <Button type="button" variant="outline" onClick={() => setMostrarForm(false)} className="border-border text-foreground hover:bg-secondary h-10 px-6">
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_rgba(245,176,39,0.3)] h-10 px-6">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Buscador y Tabla */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar usuarios..." 
          className="pl-9 h-10 bg-card border-border focus:border-primary text-foreground"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Usuario</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Rol</th>
              <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estado</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {usuariosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-muted-foreground">
                  <User className="mx-auto h-8 w-8 opacity-30 mb-2 text-primary" />
                  <p>No se encontraron usuarios.</p>
                </td>
              </tr>
            ) : (
              usuariosFiltrados.map(u => {
                const badge = ROLE_BADGES[u.rol]
                return (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{u.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${u.activo ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant={u.activo ? 'outline' : 'default'}
                        size="icon"
                        onClick={() => handleToggleEstado(u.id, u.activo)}
                        className={`h-8 w-8 ${!u.activo ? 'bg-green-600 hover:bg-green-500 text-white border-transparent' : 'border-border text-destructive hover:bg-destructive/10 hover:text-red-400'}`}
                        title={u.activo ? 'Desactivar acceso' : 'Activar acceso'}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
