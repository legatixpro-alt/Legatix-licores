'use client'

import { useNetwork } from '@/hooks/use-network'
import { processSyncQueue } from '@/lib/sync-manager'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export function OfflineBadge() {
  const { isOnline, pendingCount, refreshQueueCount } = useNetwork()
  const [isSyncing, setIsSyncing] = useState(false)

  // Autoresfrescamos para evitar desincronización de UI
  useEffect(() => {
    refreshQueueCount()
  }, [refreshQueueCount])

  if (isOnline && pendingCount === 0) return null

  const handleSyncClick = async () => {
    setIsSyncing(true)
    await processSyncQueue()
    await refreshQueueCount()
    setIsSyncing(false)
  }

  return (
    <div className="fixed top-0 left-0 w-full z-[100]">
      {!isOnline ? (
        <div className="bg-destructive text-destructive-foreground py-1.5 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="h-4 w-4" />
          MODO SIN CONEXIÓN - {pendingCount} facturas pendientes. Se guardarán en tu dispositivo.
        </div>
      ) : (
        pendingCount > 0 && (
          <div className="bg-orange-500 text-white py-1.5 px-4 text-xs font-bold text-center flex items-center justify-center gap-4 shadow-md">
            <span>Tienes {pendingCount} operaciones pendientes por sincronizar al servidor.</span>
            <button 
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
            </button>
          </div>
        )
      )}
    </div>
  )
}
