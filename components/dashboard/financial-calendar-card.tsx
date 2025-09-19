'use client'

import { LiquidCard } from '@/components/ui/liquid-card'
import { TransactionCalendar, type TransactionCalendarDay } from '@/components/transactions/transaction-calendar'

interface FinancialCalendarCardProps {
  loading: boolean
  days: TransactionCalendarDay[]
}

export function FinancialCalendarCard({ loading, days }: FinancialCalendarCardProps) {
  return (
    <LiquidCard>
      <h2 className="text-xl font-semibold">Calendário Financeiro</h2>
      <p className="text-sm text-slate-400 mt-1 mb-4">
        Acompanhe o total diário de receitas e despesas.
      </p>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-card-border/60 bg-card-glass/40 p-4"
            >
              <div className="mb-3 h-4 w-24 rounded bg-card-glass/60 animate-pulse" />
              <div className="mb-4 flex gap-3">
                <div className="h-16 flex-1 rounded-xl bg-card-glass/60 animate-pulse" />
                <div className="h-16 flex-1 rounded-xl bg-card-glass/60 animate-pulse" />
              </div>
              <div className="h-2 w-full rounded-full bg-card-glass/60 animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <TransactionCalendar days={days} />
      )}
    </LiquidCard>
  )
}
