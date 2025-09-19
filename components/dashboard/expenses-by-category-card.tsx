'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { LiquidCard } from '@/components/ui/liquid-card'
import { ChartSkeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/format-utils'
import { chartColors } from '@/lib/theme'

interface CategoryDatum {
  name: string
  value: number
}

interface ExpensesByCategoryCardProps {
  loading: boolean
  data: CategoryDatum[]
}

export function ExpensesByCategoryCard({ loading, data }: ExpensesByCategoryCardProps) {
  return (
    <LiquidCard>
      <h2 className="text-xl font-semibold mb-2">Despesas por Categoria</h2>
      {loading ? (
        <ChartSkeleton height="200px" />
      ) : data.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <span className="text-4xl block mb-2">🏷️</span>
          <p>Nenhuma despesa por categoria</p>
          <p className="text-sm">Adicione transações de despesas para ver o resumo</p>
        </div>
      ) : (
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
                {data.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </LiquidCard>
  )
}
