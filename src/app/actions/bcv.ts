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
    // Aquí podríamos verificar si la fecha_valor es muy antigua,
    // pero para evitar saturar al BCV en cada render, simplemente retornamos la guardada.
    // La actualización se hará manualmente con forceSyncTasaBcv() o vía un Cron diario.
    return { 
      success: true, 
      tasa: bdRes.tasa,
      fecha_valor: bdRes.fecha_valor
    }
  }

  // 2. Si no hay nada en la BD o falló (ej. tabla vacía), sincronizamos en vivo
  console.log('[BCV] No hay tasa local, sincronizando en vivo como fallback...')
  const syncRes = await sincronizarTasaBcv()
  
  if (syncRes.success && syncRes.tasa) {
    return {
      success: true,
      tasa: syncRes.tasa,
      fecha_valor: syncRes.fecha_valor
    }
  }

  // 3. Fallback absoluto en caso de que todo falle y el sistema deba funcionar
  return { 
    success: false, 
    error: syncRes.error || 'No se pudo obtener la tasa BCV',
    tasa: 36.5 // Fallback de emergencia, aunque el UI debería permitir editar
  }
}

/**
 * Fuerza una sincronización inmediata contra los servidores del BCV.
 * Llamar desde un botón de "Actualizar Tasa" o desde un Cron.
 */
export async function forceSyncTasaBcv() {
  return await sincronizarTasaBcv()
}
