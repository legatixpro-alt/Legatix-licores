'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, Plus, Search, Edit2, Check, X,
  Shield, AlertCircle, FileText
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Cliente, TipoDoc } from '@/types/facturacion.types'

interface Props {
  clientes: Cliente[]
  empresaId: string
}

const TIPOS_DOC: { value: TipoDoc; label: string }[] = [
  { value: 'RIF', label: 'RIF (Empresa/Persona Jurídica)' },
  { value: 'CI',  label: 'Cédula de Identidad (Persona Natural)' },
  { value: 'PASS', label: 'Pasaporte' },
  { value: 'NIT',  label: 'NIT (Extranjero)' },
  { value: 'OTRO', label: 'Otro' },
]

const CLIENTE_VACIO = {
  tipo_doc: 'RIF' as TipoDoc,
  numero_doc: '',
  razon_social: '',
  nombre_comercial: '',
  direccion_fiscal: '',
  telefono: '',
  email: '',
  es_contribuyente_especial: false,
}

export function ClientesClient({ clientes: clientesIniciales, empresaId }: Props) {
  const supabase = createClient()

  const [clientes, setClientes]         = useState<Cliente[]>(clientesIniciales)
  const [busqueda, setBusqueda]         = useState('')
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [editandoId, setEditandoId]     = useState<string | null>(null)
  const [form, setForm]                 = useState(CLIENTE_VACIO)
  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState<string | null>(null)

  const clientesFiltrados = clientes.filter(c =>
    c.razon_social.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.numero_doc.includes(busqueda)
  )

  const iniciarEdicion = (c: Cliente) => {
    setForm({
      tipo_doc: c.tipo_doc,
      numero_doc: c.numero_doc,
      razon_social: c.razon_social,
      nombre_comercial: c.nombre_comercial ?? '',
      direccion_fiscal: c.direccion_fiscal ?? '',
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      es_contribuyente_especial: c.es_contribuyente_especial,
    })
    setEditandoId(c.id)
    setMostrarForm(true)
  }

  const handleGuardar = async () => {
    if (!form.numero_doc || !form.razon_social) {
      return setError('Número de documento y nombre de la persona son obligatorios.')
    }
    setError(null)
    setGuardando(true)

    try {
      const payload = {
        empresa_id:                empresaId,
        tipo_doc:                  form.tipo_doc,
        numero_doc:                form.numero_doc.trim().toUpperCase(),
        razon_social:              form.razon_social.trim().toUpperCase(),
        nombre_comercial:          form.nombre_comercial || null,
        direccion_fiscal:          form.direccion_fiscal || null,
        telefono:                  form.telefono || null,
        email:                     form.email || null,
        es_contribuyente_especial: form.es_contribuyente_especial,
        updated_at:                new Date().toISOString(),
      }

      if (editandoId) {
        const { data, error: err } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', editandoId)
          .select()
          .single()
        if (err) throw err
        setClientes(prev => prev.map(c => c.id === editandoId ? (data as Cliente) : c))
      } else {
        const { data, error: err } = await supabase
          .from('clientes')
          .insert(payload)
          .select()
          .single()
        if (err) throw err
        setClientes(prev => [data as Cliente, ...prev])
      }

      setMostrarForm(false)
      setEditandoId(null)
      setForm(CLIENTE_VACIO)
    } catch (e: unknown) {
      const err = e as { code?: string; message: string }
      if (err.code === '23505') {
        setError(`Ya existe un cliente con ese ${form.tipo_doc}: ${form.numero_doc}`)
      } else {
        setError(err.message)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Clientes / Adquirentes</h2>
          <p className="text-sm text-muted-foreground">{clientes.length} clientes registrados</p>
        </div>
        <Button
          onClick={() => { setMostrarForm(true); setEditandoId(null); setForm(CLIENTE_VACIO) }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />Nuevo Cliente
        </Button>
      </div>

      {/* Formulario */}
      {mostrarForm && (
        <Card className="border-border bg-card shadow-md">
          <CardHeader className="pb-3 border-b mb-4">
            <CardTitle className="text-sm font-medium">
              {editandoId ? 'Editar Cliente' : 'Nuevo Cliente / Adquirente'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">Tipo de Documento *</Label>
                <select
                  value={form.tipo_doc}
                  onChange={e => setForm(f => ({ ...f, tipo_doc: e.target.value as TipoDoc }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {TIPOS_DOC.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">N° Documento (RIF/CI) *</Label>
                <Input
                  value={form.numero_doc}
                  onChange={e => setForm(f => ({ ...f, numero_doc: e.target.value }))}
                  placeholder="J-12345678-9"
                  className="h-10 text-base uppercase px-4 py-2"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">Nombre de la Persona *</Label>
                <Input
                  value={form.razon_social}
                  onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))}
                  placeholder="JUAN PEREZ"
                  className="h-10 text-base px-4 py-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">Nombre Comercial (Opcional)</Label>
                <Input
                  value={form.nombre_comercial}
                  onChange={e => setForm(f => ({ ...f, nombre_comercial: e.target.value }))}
                  className="h-10 text-base px-4 py-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">Teléfono</Label>
                <Input
                  value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  className="h-10 text-base px-4 py-2"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="h-10 text-base px-4 py-2"
                />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <Label className="text-sm font-medium mb-2 block text-muted-foreground">Dirección Fiscal</Label>
                <Input
                  value={form.direccion_fiscal}
                  onChange={e => setForm(f => ({ ...f, direccion_fiscal: e.target.value }))}
                  placeholder="Dirección completa del domicilio fiscal"
                  className="h-10 text-base px-4 py-2"
                />
              </div>
              <div className="col-span-2 sm:col-span-3 flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="contrib-especial"
                  checked={form.es_contribuyente_especial}
                  onChange={e => setForm(f => ({ ...f, es_contribuyente_especial: e.target.checked }))}
                  className="h-5 w-5 rounded border-input bg-background accent-primary"
                />
                <Label htmlFor="contrib-especial" className="text-sm cursor-pointer flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-amber-500" />
                  Contribuyente Especial (aplica retención IVA según SENIAT)
                </Label>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" size="sm" onClick={() => { setMostrarForm(false); setError(null) }}>
                <X className="h-4 w-4 mr-1" />Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleGuardar}
                disabled={guardando}
              >
                <Check className="h-4 w-4 mr-1" />
                {guardando ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente por nombre o número de documento..."
          className="pl-10 h-10 bg-card border-border shadow-sm text-foreground"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {/* Listado */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo Doc.</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">N° Documento</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nombre de la Persona</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dirección Fiscal</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No hay clientes registrados</p>
                </td>
              </tr>
            ) : (
              clientesFiltrados.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 group transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded">{c.tipo_doc}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-foreground">{c.numero_doc}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{c.razon_social}</p>
                    {c.nombre_comercial && <p className="text-xs text-muted-foreground">{c.nombre_comercial}</p>}
                    {c.es_contribuyente_especial && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 flex items-center gap-1 mt-0.5">
                        <Shield className="h-3 w-3" />Contribuyente Especial
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {c.direccion_fiscal ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.telefono && <p>{c.telefono}</p>}
                    {c.email && <p className="text-primary">{c.email}</p>}
                  </td>
                  <td className="px-4 py-3 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => iniciarEdicion(c)}
                      title="Editar Cliente"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <a href={`/clientes/${c.id}`} className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Ver Historial">
                        <FileText className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
