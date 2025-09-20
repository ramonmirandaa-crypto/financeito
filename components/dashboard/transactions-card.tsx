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
  page: number
  pageSize: number
  totalCount: number
  hasNextPage: boolean
  hasPreviousPage: boolean
  onPageChange: (page: number) => void
  onEdit: (transactionId: string) => void
  onConnect: () => void
  disabled: boolean
}

export function TransactionsCard({
  loading,
  transactions,
  page,
  pageSize,
  totalCount,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onEdit,
  onConnect,
  disabled,
}: TransactionsCardProps) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safePageSize =
    Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / safePageSize) : 1
  const hasTransactionsOnPage = transactions.length > 0
  const startItem =
    totalCount > 0
      ? Math.min((safePage - 1) * safePageSize + 1, totalCount)
      : 0
  const endItem = hasTransactionsOnPage
    ? Math.min(startItem + transactions.length - 1, totalCount)
    : totalCount > 0
      ? Math.min(safePage * safePageSize, totalCount)
      : 0
  const displayStart = hasTransactionsOnPage ? startItem : 0
  const displayEnd = hasTransactionsOnPage ? Math.max(endItem, startItem) : 0

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
      ) : totalCount === 0 ? (
        <EmptyTransactions onConnect={onConnect} disabled={disabled} />
      ) : transactions.length === 0 ? (
        <div className="text-sm text-slate-400">
          Nenhuma transação encontrada nesta página.
        </div>
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
            {transactions.map((transaction) => {
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
          </ul>
          <div className="flex flex-col gap-2 mt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-400">
              Página {Math.min(safePage, Math.max(totalPages, 1))} de{' '}
              {Math.max(totalPages, 1)} · Mostrando{' '}
              {displayStart} - {displayEnd} de {totalCount}
            </div>
            <div className="flex gap-2 justify-end">
              <LiquidButton
                size="sm"
                variant="outline"
                onClick={() => {
                  onPageChange(safePage - 1)
                }}
                disabled={loading || !hasPreviousPage}
              >
                Anterior
              </LiquidButton>
              <LiquidButton
                size="sm"
                variant="outline"
                onClick={() => {
                  onPageChange(safePage + 1)
                }}
                disabled={loading || !hasNextPage}
              >
                Próximo
              </LiquidButton>
            </div>
          </div>
        </>
      )}
    </LiquidCard>
  )
}
