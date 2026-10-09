'use client'

import { useState, useEffect } from 'react'
import { getSyncQueue } from '@/lib/offline-db'

export function useNetwork() {
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [pendingCount, setPendingCount] = useState<number>(0)

  // Chequear la cola local
  const checkQueue = async () => {
    try {
      const queue = await getSyncQueue()
      setPendingCount(queue.length)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    // Estado inicial
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    checkQueue()

    const handleOnline = () => {
      setIsOnline(true)
      checkQueue()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      checkQueue()
    }

    // Intervalo para chequear la cola periódicamente
    const interval = setInterval(checkQueue, 5000)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  return { isOnline, pendingCount, refreshQueueCount: checkQueue }
}
