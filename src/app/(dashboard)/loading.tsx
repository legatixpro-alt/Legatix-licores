import { Loader2 } from 'lucide-react'

export default function DashboardLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 rounded-full border-4 border-primary/20"></div>
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground animate-pulse">
          Cargando módulo...
        </h2>
        <p className="text-sm text-muted-foreground">
          Preparando datos en tiempo real
        </p>
      </div>
    </div>
  )
}
