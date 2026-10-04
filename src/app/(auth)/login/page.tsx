'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background relative overflow-hidden">
      
      {/* Elementos de fondo decorativos */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-md mx-4">
        
        {/* Contenedor del Logo con Resplandor */}
        <div className="flex justify-center mb-8 relative">
          {/* El resplandor (Glow) detrás del logo */}
          <div className="absolute inset-0 m-auto w-32 h-32 bg-primary/40 rounded-full blur-2xl animate-pulse" />
          
          {/* El Logo recortado (solo la moneda) */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-[0_0_40px_rgba(245,176,39,0.3)] border-2 border-primary/20 bg-black">
            <Image 
              src="/logo-legatix.jpg"
              alt="Logo Legatix"
              fill
              className="object-cover scale-[1.05]"
              style={{
                clipPath: 'circle(48% at 50% 50%)'
              }}
              priority
            />
          </div>
        </div>

        {/* Tarjeta de Login */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex flex-col items-center justify-center space-y-2 border-b border-border/50 bg-secondary/30 px-8 py-6 text-center">
            <h3 className="text-2xl font-black tracking-tight">
              <span className="text-primary drop-shadow-sm">LEGATIX</span> <span className="text-foreground">PRO</span>
            </h3>
            <p className="text-sm text-muted-foreground">Ingresa tus credenciales para acceder al sistema</p>
          </div>
          
          <div className="px-8 py-8">
            <form onSubmit={handleLogin} className="flex flex-col space-y-5">
              
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full h-11 rounded-lg border border-border bg-background/50 pl-10 pr-4 text-foreground placeholder-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="admin@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-11 rounded-lg border border-border bg-background/50 pl-10 pr-4 text-foreground placeholder-muted-foreground/50 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 border border-destructive/20">
                  <p className="text-sm text-destructive text-center font-medium">{error}</p>
                </div>
              )}

              <button
                disabled={loading}
                className={`
                  mt-2 flex h-11 w-full items-center justify-center rounded-lg text-sm font-bold tracking-wide transition-all
                  ${loading 
                    ? 'cursor-not-allowed bg-primary/50 text-primary-foreground/70' 
                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(245,176,39,0.2)] hover:shadow-[0_0_25px_rgba(245,176,39,0.4)]'
                  }
                `}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Acceder al Sistema'
                )}
              </button>
            </form>
          </div>
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-center text-xs text-muted-foreground font-medium">
          &copy; {new Date().getFullYear()} Legatix. El estándar definitivo.
        </p>

      </div>
    </div>
  )
}
