'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { ChartSkeleton } from '@/components/ui/skeleton'
import { EmptyAccounts } from '@/components/ui/empty-state'
import { chartColors } from '@/lib/theme'
import { formatCurrency } from '@/lib/format-utils'

interface AccountData {
  id: string
  name: string
  balance: number
}

interface AccountsCardProps {
  loading: boolean
  accounts: AccountData[]
  onConnect: () => void
  disabled: boolean
}

export function AccountsCard({ loading, accounts, onConnect, disabled }: AccountsCardProps) {
  return (
    <LiquidCard>
      <h2 className="text-xl font-semibold mb-2">Contas</h2>
      {loading ? (
        <>
          <ChartSkeleton height="200px" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex justify-between">
                <div className="bg-card-glass/30 h-4 w-24 rounded animate-pulse"></div>
                <div className="bg-card-glass/30 h-4 w-16 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </>
      ) : accounts.length === 0 ? (
        <EmptyAccounts onConnect={onConnect} disabled={disabled} />
      ) : (
        <>
          <div className="mb-4" style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={accounts} dataKey="balance" nameKey="name" outerRadius={80}>
                  {accounts.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="text-sm mb-4 space-y-1">
            {accounts.map((account) => (
              <li key={account.id} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-semibold">{formatCurrency(account.balance)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <LiquidButton onClick={onConnect} disabled={disabled}>
        {loading ? 'Carregando...' : 'Conectar Conta'}
      </LiquidButton>
    </LiquidCard>
  )
}
