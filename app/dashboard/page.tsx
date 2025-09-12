'use client'
import { useEffect, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from 'recharts'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { motion } from 'framer-motion'

export default function Dashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])

  async function loadData() {
    const r = await fetch('/api/pluggy/sync')
    if (r.ok) {
      const json = await r.json()
      setAccounts((json.accounts || []).map((a: any) => ({ ...a, balance: Number(a.balance) })))
      setTransactions((json.transactions || []).map((t: any) => ({ ...t, amount: Number(t.amount) })))
    }
  }

  useEffect(() => { loadData() }, [])

  const handleConnect = async () => {
    const r = await fetch('/api/pluggy/link-token', { method: 'POST' })
    const json = await r.json()
    const connectToken = json.connectToken || json.linkToken
    // @ts-ignore
    const connect = new window.PluggyConnect({ connectToken })
    connect.onSuccess(async (item: any) => {
      await fetch('/api/pluggy/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      })
      await loadData()
    })
    connect.init()
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#8dd1e1']

  const balanceData = transactions
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce<{ date: string; balance: number }[]>((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].balance : 0
      acc.push({ date: t.date, balance: prev + t.amount })
      return acc
    }, [])

  const categoryMap: Record<string, number> = {}
  transactions.forEach((t) => {
    const cat = t.category || t.providerCategoryName || 'Outros'
    categoryMap[cat] = (categoryMap[cat] || 0) + t.amount
  })
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }))

  return (
    <motion.div
      className="grid md:grid-cols-2 gap-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Contas</h2>
          <div className="mb-4" style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={accounts} dataKey="balance" nameKey="name" outerRadius={80}>
                  {accounts.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="text-sm mb-4">
            {accounts.map((a) => (
              <li key={a.id}>{a.name}: {a.balance}</li>
            ))}
          </ul>
          <LiquidButton onClick={handleConnect}>Conectar Conta</LiquidButton>
        </LiquidCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Transações</h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={transactions}>
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString()}
                  hide={transactions.length > 10}
                />
                <YAxis />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="text-sm mt-4 space-y-1 max-h-48 overflow-auto">
            {transactions.map((t) => (
              <li key={t.id}>{new Date(t.date).toLocaleDateString()}: {t.description} ({t.amount})</li>
            ))}
          </ul>
        </LiquidCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Evolução de Saldos</h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={balanceData}>
                <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
                <YAxis />
                <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString()} />
                <Line type="monotone" dataKey="balance" stroke="#82ca9d" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </LiquidCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Resumo por Categoria</h2>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={80}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </LiquidCard>
      </motion.div>
    </motion.div>
  )
}
