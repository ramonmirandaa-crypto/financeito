'use client'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { ChartSkeleton, TransactionSkeleton } from '@/components/ui/skeleton'
import { EmptyTransactions } from '@/components/ui/empty-state'
import {
  formatCurrency,
  formatCurrencyWithSign,
  formatDate,
  formatDateShort,
} from '@/lib/format-utils'
import { chartColors } from '@/lib/theme'
import type { NormalizedTransaction } from '@/lib/transactions'

interface TransactionsCardProps {
  loading: boolean
  transactions: NormalizedTransaction[]
  onEdit: (transactionId: string) => void
  onConnect: () => void
  disabled: boolean
}

export function TransactionsCard({
  loading,
  transactions,
  onEdit,
  onConnect,
  disabled,
}: TransactionsCardProps) {
  return (
    <LiquidCard>
      <h2 className="text-xl font-semibold mb-2">Transações</h2>
      {loading ? (
        <>
          <ChartSkeleton height="200px" />
          <div className="mt-4">
            <TransactionSkeleton />
          </div>
        </>
      ) : transactions.length === 0 ? (
        <EmptyTransactions onConnect={onConnect} disabled={disabled} />
      ) : (
        <>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={transactions}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => formatDateShort(value)}
                  hide={transactions.length > 10}
                />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
                <Tooltip
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value: number) => [formatCurrency(Number(value)), 'Valor']}
                />
                <Bar dataKey="amount" fill={chartColors[0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="text-sm mt-4 space-y-1 max-h-48 overflow-auto">
            {transactions.slice(0, 10).map((transaction) => {
              const currencyData = formatCurrencyWithSign(transaction.amount)
              return (
                <li
                  key={transaction.id}
                  className="flex justify-between items-center p-2 hover:bg-card-glass/20 rounded"
                >
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-slate-400 text-xs">{formatDate(transaction.date)}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-semibold ${currencyData.className}`}>
                      {currencyData.value}
                    </div>
                    <LiquidButton
                      size="sm"
                      variant="outline"
                      className="text-xs px-3 py-1"
                      onClick={() => onEdit(transaction.id)}
                    >
                      Editar
                    </LiquidButton>
                  </div>
                </li>
              )
            })}
            {transactions.length > 10 && (
              <li className="text-center text-slate-400 text-xs pt-2">
                +{transactions.length - 10} transações adicionais
              </li>
            )}
          </ul>
        </>
      )}
    </LiquidCard>
  )
}
