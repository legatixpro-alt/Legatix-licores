'use server'

import { sincronizarTasaBcv, obtenerUltimaTasaBcv } from '@/lib/bcv-service'

/**
 * Intenta obtener la tasa más reciente de la BD.
 * Si no hay ninguna o es muy vieja (opcional), intenta sincronizar en vivo.
 * Esta función es la que llaman los componentes del cliente (POS, Nueva Factura).
 */
export async function getTasaBcv(): Promise<{ success: boolean; tasa?: number; fecha_valor?: string; error?: string }> {
  // 1. Intentar leer de la BD
  const bdRes = await obtenerUltimaTasaBcv()
  
  if (bdRes.success && bdRes.tasa) {
    // Validar si la tasa fue obtenida hoy. Si es vieja, forzamos sincronización automática
    const hoyStr = new Date().toISOString().split('T')[0]
    const obtenidaEnStr = bdRes.obtenida_en ? new Date(bdRes.obtenida_en).toISOString().split('T')[0] : ''

    if (obtenidaEnStr !== hoyStr) {
      console.log(`[BCV] Tasa local es de fecha anterior (${obtenidaEnStr}). Forzando sincronización automática para hoy (${hoyStr})...`)
      const syncRes = await sincronizarTasaBcv()
      if (syncRes.success && syncRes.tasa) {
        return {
          success: true,
          tasa: syncRes.tasa,
          fecha_valor: syncRes.fecha_valor
        }
      }
      // Si la sincronización falla (BCV caído), usamos la última conocida
      console.warn('[BCV] Falló sincronización al día, usando última conocida.')
    }

    return { 
      success: true, 
      tasa: Math.round(Number(bdRes.tasa) * 100) / 100,
      fecha_valor: bdRes.fecha_valor
    }
  }

  // 2. Si no hay nada en la BD o falló (ej. tabla vacía), sincronizamos en vivo
  console.log('[BCV] No hay tasa local, sincronizando en vivo como fallback...')
  const syncRes = await sincronizarTasaBcv()
  
  if (syncRes.success && syncRes.tasa) {
    return {
      success: true,
      tasa: Math.round(Number(syncRes.tasa) * 100) / 100,
      fecha_valor: syncRes.fecha_valor
    }
  }

  // 3. Fallback absoluto en caso de que todo falle y el sistema deba funcionar
  return { 
    success: false, 
    error: syncRes.error || 'No se pudo obtener la tasa BCV',
    tasa: 876.80 // Fallback de emergencia coherente con la fecha actual
  }
}

/**
 * Fuerza una sincronización inmediata contra los servidores del BCV.
 * Llamar desde un botón de "Actualizar Tasa" o desde un Cron.
 */
export async function forceSyncTasaBcv() {
  return await sincronizarTasaBcv()
}
