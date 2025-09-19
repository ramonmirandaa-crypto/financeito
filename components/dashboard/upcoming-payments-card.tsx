'use client'

import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { CardSkeleton } from '@/components/ui/skeleton'
import {
  EmptyUpcomingPayments,
} from '@/components/ui/empty-state'
import {
  formatCurrency,
  formatDate,
  isUpcoming,
  isOverdue,
} from '@/lib/format-utils'

interface UpcomingPaymentItem {
  type: string
  name: string
  date: string
  amount: number
}

interface UpcomingPaymentsCardProps {
  loading: boolean
  payments: UpcomingPaymentItem[]
}

export function UpcomingPaymentsCard({ loading, payments }: UpcomingPaymentsCardProps) {
  if (loading) {
    return <CardSkeleton />
  }

  const hasUpcomingPayments = payments.length > 0

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <LiquidCard>
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <span className={`${hasUpcomingPayments ? 'text-yellow-400' : 'text-green-400'} mr-2`}>
            {hasUpcomingPayments ? '⚠️' : '✅'}
          </span>
          Próximos Vencimentos
        </h2>
        {hasUpcomingPayments ? (
          <div className="space-y-2">
            {payments.slice(0, 5).map((payment, index) => (
              <div
                key={`${payment.name}-${payment.date}-${index}`}
                className="flex justify-between items-center p-2 bg-card-glass/30 rounded-lg"
              >
                <div>
                  <span className="font-medium">{payment.name}</span>
                  <span className="text-slate-400 text-sm ml-2">({payment.type})</span>
                </div>
                <div className="text-right">
                  <div
                    className={`font-semibold ${
                      isOverdue(payment.date)
                        ? 'text-red-400'
                        : isUpcoming(payment.date, 1)
                        ? 'text-yellow-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {formatDate(payment.date)}
                  </div>
                  <div className="text-sm text-slate-300">
                    {formatCurrency(payment.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyUpcomingPayments />
        )}
      </LiquidCard>
    </motion.div>
  )
}
