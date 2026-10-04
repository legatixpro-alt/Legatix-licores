'use server'

/**
 * Obtiene la tasa oficial del Banco Central de Venezuela (BCV).
 * Utiliza una API comunitaria estable ya que el portal oficial bloquea
 * frecuentemente las peticiones automatizadas.
 */
export async function getTasaBcv(): Promise<{ success: boolean; tasa?: number; error?: string }> {
  try {
    const response = await fetch('https://pydolarvenezuela-api.vercel.app/api/v1/dollar/page?page=bcv', {
      next: { revalidate: 3600 }, // Revalidar cache cada hora
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    
    // La API devuelve un objeto con "monitors" y dentro "usd"
    if (data && data.monitors && data.monitors.usd && data.monitors.usd.price) {
      return { success: true, tasa: parseFloat(data.monitors.usd.price) }
    }
    
    return { success: false, error: 'Formato de respuesta inesperado de la API' }
  } catch (error) {
    console.error('Error fetching BCV rate:', error)
    return { success: false, error: 'No se pudo conectar con el servidor para obtener la tasa BCV' }
  }
}
