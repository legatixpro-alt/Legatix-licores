'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatUSD } from '@/lib/fiscal'

interface VentasChartProps {
  facturas30Dias: { fecha_emision: string; total_usd: number }[]
}

export function VentasChart({ facturas30Dias }: VentasChartProps) {
  const [rango, setRango] = useState<'7' | '15' | '30'>('7')

  const chartData = useMemo(() => {
    // Generar las fechas del rango
    const data: Record<string, number> = {}
    const hoy = new Date()
    const diasStr = parseInt(rango)

    // Inicializar el diccionario con 0 para cada día del rango
    for (let i = diasStr - 1; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      data[dateStr] = 0
    }

    // Sumar las facturas
    facturas30Dias.forEach(f => {
      const d = f.fecha_emision
      if (data[d] !== undefined) {
        data[d] += Number(f.total_usd)
      }
    })

    // Convertir a array para recharts
    return Object.entries(data).map(([fecha, total]) => {
      // Formatear fecha para el eje X (ej: '03 Oct')
      const dateObj = new Date(fecha + 'T00:00:00') // Forzar zona local
      const label = dateObj.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' })
      return {
        fecha,
        label,
        total
      }
    })
  }, [facturas30Dias, rango])

  return (
    <Card className="col-span-1 lg:col-span-4 bg-black/40 border-white/10 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-foreground">Tendencia de Ventas (USD)</CardTitle>
        <div className="flex gap-2">
          {(['7', '15', '30'] as const).map(d => (
            <button
              key={d}
              onClick={() => setRango(d)}
              className={`text-xs px-2 py-1 rounded-md transition-colors ${
                rango === d ? 'bg-primary text-primary-foreground font-bold' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
              }`}
            >
              {d} días
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="rgba(255,255,255,0.5)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
                formatter={(value: number) => [formatUSD(value), 'Ventas']}
                labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
