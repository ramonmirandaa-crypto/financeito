'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { LiquidCard } from '@/components/ui/liquid-card'
import { ChartSkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatDateShort } from '@/lib/format-utils'
import { chartColors } from '@/lib/theme'

interface BalancePoint {
  date: string
  balance: number
}

interface BalanceEvolutionCardProps {
  loading: boolean
  data: BalancePoint[]
}

export function BalanceEvolutionCard({ loading, data }: BalanceEvolutionCardProps) {
  return (
    <LiquidCard>
      <h2 className="text-xl font-semibold mb-2">Evolução de Saldos</h2>
      {loading ? (
        <ChartSkeleton height="200px" />
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <span className="text-4xl block mb-2">📈</span>
          <p>Dados insuficientes para gerar gráfico</p>
          <p className="text-sm">Adicione transações para ver a evolução</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={data}>
              <XAxis dataKey="date" tickFormatter={(value) => formatDateShort(value)} />
              <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
              <Tooltip
                labelFormatter={(value) => formatDate(value)}
                formatter={(value: number) => [formatCurrency(Number(value)), 'Saldo']}
              />
              <Line type="monotone" dataKey="balance" stroke={chartColors[1]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </LiquidCard>
  )
}
