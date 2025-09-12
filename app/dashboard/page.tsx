'use client'
import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

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

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      >
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
        <button className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30" onClick={handleConnect}>Conectar Conta</button>
      </div>
      <div
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-xl"
        style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' }}
      >
        <h2 className="text-xl font-semibold mb-2">Transações</h2>
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={transactions}>
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} hide={transactions.length > 10} />
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
      </div>
    </div>
  )
}
