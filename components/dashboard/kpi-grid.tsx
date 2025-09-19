'use client'

import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { KPISkeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatCurrencyWithSign } from '@/lib/format-utils'

interface KpiGridProps {
  loading: boolean
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyResult: number
}

export function KpiGrid({
  loading,
  totalBalance,
  monthlyIncome,
  monthlyExpenses,
  monthlyResult,
}: KpiGridProps) {
  if (loading) {
    return <KPISkeleton />
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <LiquidCard className="text-center">
        <div className="text-2xl font-bold text-blue-400">
          {formatCurrency(totalBalance)}
        </div>
        <div className="text-sm text-slate-400">Saldo Total</div>
      </LiquidCard>

      <LiquidCard className="text-center">
        <div className="text-2xl font-bold text-green-400">
          {formatCurrency(monthlyIncome)}
        </div>
        <div className="text-sm text-slate-400">Receitas</div>
      </LiquidCard>

      <LiquidCard className="text-center">
        <div className="text-2xl font-bold text-red-400">
          {formatCurrency(monthlyExpenses)}
        </div>
        <div className="text-sm text-slate-400">Despesas</div>
      </LiquidCard>

      <LiquidCard className="text-center">
        <div
          className={`text-2xl font-bold ${
            monthlyResult >= 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {formatCurrencyWithSign(monthlyResult, true).value}
        </div>
        <div className="text-sm text-slate-400">Resultado</div>
      </LiquidCard>
    </motion.div>
  )
}
