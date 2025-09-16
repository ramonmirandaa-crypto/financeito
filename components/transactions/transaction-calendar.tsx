'use client'

import { formatCurrency, formatDate } from '@/lib/format-utils'
import { cn } from '@/lib/utils'

export interface TransactionCalendarDay {
  date: string
  income: number
  expense: number
}

interface TransactionCalendarProps {
  days: TransactionCalendarDay[]
}

const BRAZIL_TIME_ZONE = 'America/Sao_Paulo'

const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'short',
  timeZone: BRAZIL_TIME_ZONE,
})

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  timeZone: BRAZIL_TIME_ZONE,
})

const parseToBrazilDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  if ([year, month, day].some((part) => Number.isNaN(part))) {
    const fallback = new Date(isoDate)
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback
  }

  // Utiliza meio-dia UTC para garantir o mesmo dia em São Paulo independentemente do fuso do navegador.
  return new Date(Date.UTC(year, month - 1, day, 12))
}

export function TransactionCalendar({ days }: TransactionCalendarProps) {
  if (!days || days.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
        <span className="text-4xl mb-2">🗓️</span>
        <p className="text-base font-medium text-slate-300">
          Nenhuma movimentação encontrada
        </p>
        <p className="text-sm text-slate-400/80">
          As receitas e despesas consolidadas aparecerão aqui assim que você registrar transações.
        </p>
      </div>
    )
  }

  const sortedDays = [...days].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Receitas
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          Despesas
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Saldo do dia
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {sortedDays.map((day) => {
          const dayDate = parseToBrazilDate(day.date)
          const weekDay = weekdayFormatter.format(dayDate).replace('.', '')
          const monthLabel = monthFormatter.format(dayDate).replace('.', '')
          const [, , dayPart] = day.date.split('-')
          const dayNumber = (dayPart ?? dayDate.getUTCDate().toString()).padStart(2, '0')
          const balance = day.income - day.expense
          const total = day.income + day.expense
          const incomePercent = total > 0 ? (day.income / total) * 100 : 0
          const expensePercent = total > 0 ? (day.expense / total) * 100 : 0

          return (
            <div
              key={day.date}
              className={cn(
                'rounded-2xl border border-white/5 bg-card-glass/40 p-4 transition-all duration-200 hover:-translate-y-1 hover:bg-card-glass/60',
                balance >= 0
                  ? 'shadow-[0_0_25px_rgba(16,185,129,0.12)] hover:border-emerald-400/40'
                  : 'shadow-[0_0_25px_rgba(248,113,113,0.12)] hover:border-rose-400/40'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    {weekDay}
                  </div>
                  <div className="text-2xl font-semibold text-white">
                    {dayNumber}
                    <span className="ml-1 text-sm font-normal text-slate-400">
                      {monthLabel}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">{formatDate(dayDate)}</div>
                </div>
                <div
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                    balance >= 0
                      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
                      : 'border-rose-400/30 bg-rose-500/15 text-rose-200'
                  )}
                >
                  {balance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                  <div className="text-xs uppercase tracking-wide text-emerald-200/80">
                    Receitas
                  </div>
                  <div className="text-lg font-semibold text-emerald-100">
                    {formatCurrency(day.income)}
                  </div>
                </div>
                <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3">
                  <div className="text-xs uppercase tracking-wide text-rose-200/80">
                    Despesas
                  </div>
                  <div className="text-lg font-semibold text-rose-100">
                    {formatCurrency(day.expense)}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Saldo</span>
                  <span
                    className={cn(
                      'font-semibold',
                      balance >= 0 ? 'text-emerald-200' : 'text-rose-200'
                    )}
                  >
                    {formatCurrency(balance)}
                  </span>
                </div>
                <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full bg-emerald-400/80"
                    style={{ width: `${incomePercent}%` }}
                  />
                  <div
                    className="h-full bg-rose-400/80"
                    style={{ width: `${expensePercent}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
