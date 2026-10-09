import { NextResponse } from 'next/server'
import { sincronizarTasaBcv } from '@/lib/bcv-service'

// Revalidación: nunca (es un webhook manual/cron)
export const dynamic = 'force-dynamic'

/**
 * Endpoint para Cron Jobs (Vercel Cron, GitHub Actions, AWS, etc.)
 * GET /api/cron/bcv
 * 
 * Se recomienda proteger este endpoint con un token (ej. CRON_SECRET)
 * en producción para que nadie lo sature.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  
  // Si tienes un CRON_SECRET en el .env, validarlo (opcional, pero recomendado)
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const res = await sincronizarTasaBcv()
    
    if (res.success) {
      return NextResponse.json({ 
        message: 'Tasa sincronizada correctamente',
        data: res
      }, { status: 200 })
    } else {
      return NextResponse.json({ 
        error: 'Falló la sincronización con el BCV',
        details: res.error 
      }, { status: 500 })
    }
  } catch (err: any) {
    return NextResponse.json({ 
      error: 'Error interno ejecutando el cron',
      details: err.message
    }, { status: 500 })
  }
}
