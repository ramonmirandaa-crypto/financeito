'use client'
import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
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
import { TransactionForm, TransactionFormData } from '@/components/forms/transaction-form'
import { motion } from 'framer-motion'
import { chartColors } from '@/lib/theme'
import { QuickAccess, QuickAccessItem } from '@/components/quick-access'
import { QuickActions, QuickAction } from '@/components/quick-actions'
import {
  formatCurrency,
  formatDate,
  formatCurrencyWithSign,
  formatDateShort,
  isUpcoming,
  isOverdue
} from '@/lib/format-utils'
import { KPISkeleton, CardSkeleton, TransactionSkeleton, ChartSkeleton } from '@/components/ui/skeleton'
import {
  EmptyAccounts,
  EmptyTransactions,
  EmptyUpcomingPayments
} from '@/components/ui/empty-state'
import { createHandleConnect } from '@/lib/pluggy-connect'
import {
  TransactionCalendar,
  type TransactionCalendarDay,
} from '@/components/transactions/transaction-calendar'

interface Transaction {
  id: string
  description: string
  category?: string | null
  amount: number
  date: string
  currency?: string
  accountId?: string
  raw?: any
  isRecurring?: boolean
  createdAt?: string
  providerCategoryName?: string
}

const parseDateValue = (value: unknown): string => {
  if (!value) {
    return new Date().toISOString()
  }

  if (typeof value === 'string') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value as string)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return new Date().toISOString()
}

const formatDateForInput = (value?: string) => {
  if (!value) {
    return new Date().toISOString().split('T')[0]
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  if (match) {
    return match[0]
  }

  return new Date().toISOString().split('T')[0]
}

const normalizeTransaction = (transaction: any): Transaction => ({
  ...transaction,
  id: transaction.id,
  description: transaction.description ?? '',
  category: transaction.category ?? '',
  amount: Number(transaction.amount ?? 0),
  date: parseDateValue(transaction.date),
})

const toTransactionFormData = (transaction: Transaction): TransactionFormData => ({
  id: transaction.id,
  description: transaction.description ?? '',
  category: transaction.category ?? '',
  amount: transaction.amount,
  date: formatDateForInput(transaction.date),
})

export default function Dashboard() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [transactionFormData, setTransactionFormData] = useState<TransactionFormData | null>(null)
  const [loadingTransactionForm, setLoadingTransactionForm] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  async function loadData() {
    setLoading(true)
    try {
      // Load Pluggy data
      const r = await fetch('/api/pluggy/sync')
      if (r.status === 401) {
        window.location.href = '/login'
        return
      }
      if (r.ok) {
        const json = await r.json()
        setAccounts((json.accounts || []).map((a: any) => ({ ...a, balance: Number(a.balance) })))
        setTransactions((json.transactions || []).map((t: any) => normalizeTransaction(t)))
      }

      // Load all finance data in parallel
      const [budgetRes, goalsRes, subscriptionsRes, loansRes] = await Promise.all([
        fetch('/api/budget'),
        fetch('/api/goals'),
        fetch('/api/subscriptions'),
        fetch('/api/loans')
      ])

      if (budgetRes.ok) {
        const budgetData = await budgetRes.json()
        setBudgets(budgetData)
      }
      if (goalsRes.ok) {
        const goalsData = await goalsRes.json()
        setGoals(goalsData)
      }
      if (subscriptionsRes.ok) {
        const subscriptionsData = await subscriptionsRes.json()
        setSubscriptions(subscriptionsData)
      }
      if (loansRes.ok) {
        const loansData = await loansRes.json()
        setLoans(loansData)
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error(
        'Erro ao carregar dados',
        'Não foi possível carregar suas informações financeiras. Tente novamente.',
        { duration: 5000 }
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/login')
      return
    }
    loadData()
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if ((window as any).PluggyConnect) {
      setSdkReady(true)
      return
    }
    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://connect.pluggy.ai/sdk.js"]'
    )
    const handler = () => setSdkReady(true)
    script?.addEventListener('load', handler)
    return () => script?.removeEventListener('load', handler)
  }, [])

  const handleConnect = createHandleConnect({ toast, onAfterSync: loadData })

  const closeTransactionModal = () => {
    setIsTransactionModalOpen(false)
    setSelectedTransactionId(null)
    setTransactionFormData(null)
    setLoadingTransactionForm(false)
    setSavingTransaction(false)
  }

  const handleOpenTransactionModal = async (transactionId: string) => {
    const existingTransaction = transactions.find((transaction) => transaction.id === transactionId)
    setSelectedTransactionId(transactionId)

    if (existingTransaction) {
      setTransactionFormData(toTransactionFormData(existingTransaction))
    } else {
      setTransactionFormData(null)
    }

    setIsTransactionModalOpen(true)
    setLoadingTransactionForm(!existingTransaction)

    try {
      const response = await fetch(`/api/transactions/${transactionId}`)
      if (!response.ok) {
        throw new Error('Failed to load transaction')
      }

      const data = await response.json()
      const normalized = normalizeTransaction(data)
      setTransactionFormData(toTransactionFormData(normalized))
    } catch (error) {
      console.error('Erro ao carregar transação:', error)
      toast.error(
        'Erro ao carregar transação',
        'Não foi possível carregar os dados da transação selecionada.'
      )
      if (!existingTransaction) {
        closeTransactionModal()
      }
    } finally {
      setLoadingTransactionForm(false)
    }
  }

  const handleUpdateTransaction = async (values: TransactionFormData) => {
    if (!selectedTransactionId) {
      return
    }

    setSavingTransaction(true)

    try {
      const trimmedCategory =
        typeof values.category === 'string' ? values.category.trim() : ''

      const response = await fetch(`/api/transactions/${selectedTransactionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: values.description.trim(),
          category: trimmedCategory || null,
          amount: values.amount,
          date: values.date,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update transaction')
      }

      const data = await response.json()
      const normalized = normalizeTransaction(data)

      setTransactions((prev) =>
        prev.map((transaction) =>
          transaction.id === normalized.id ? { ...transaction, ...normalized } : transaction
        )
      )

      toast.success(
        'Transação atualizada',
        'As alterações foram salvas com sucesso.'
      )

      closeTransactionModal()
    } catch (error) {
      console.error('Erro ao atualizar transação:', error)
      toast.error(
        'Erro ao atualizar transação',
        'Não foi possível salvar as alterações. Tente novamente.'
      )
    } finally {
      setSavingTransaction(false)
    }
  }

  const balanceData = transactions
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .reduce<{ date: string; balance: number }[]>((acc, t) => {
      const prev = acc.length ? acc[acc.length - 1].balance : 0
      acc.push({ date: t.date, balance: prev + t.amount })
      return acc
    }, [])

  // Resumo por categoria apenas para despesas (valores negativos)
  const categoryMap: Record<string, number> = {}
  transactions
    .filter(t => t.amount < 0) // Apenas despesas
    .forEach((t) => {
      const cat = t.category || t.providerCategoryName || 'Outros'
      categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount) // Usar valor absoluto
    })
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
    name,
    value,
  }))

  const calendarData = Object.values(
    transactions.reduce<Record<string, TransactionCalendarDay>>((acc, t) => {
      const normalizedDate = formatDateForInput(t.date)

      const current = acc[normalizedDate] ?? {
        date: normalizedDate,
        income: 0,
        expense: 0,
      }

      acc[normalizedDate] = {
        ...current,
        income: current.income + (t.amount >= 0 ? t.amount : 0),
        expense: current.expense + (t.amount < 0 ? Math.abs(t.amount) : 0),
      }

      return acc
    }, {})
  ).sort(
    (a, b) =>
      new Date(`${a.date}T00:00:00`).getTime() -
      new Date(`${b.date}T00:00:00`).getTime()
  )

  const quickAccessItems: QuickAccessItem[] = [
    {
      title: 'Transações',
      description: 'Histórico de movimentações',
      href: '/dashboard#transactions',
    },
    {
      title: 'Cartões',
      description: 'Gerencie seus cartões',
      href: '/dashboard#cards',
    },
    {
      title: 'Relatórios',
      description: 'Relatórios detalhados',
      href: '/dashboard#reports',
    },
    { title: 'Orçamentos', description: 'Planeje seus gastos', href: '/budget' },
    { title: 'Metas', description: 'Acompanhe seus objetivos', href: '/goals' },
    {
      title: 'Assinaturas',
      description: 'Controle suas assinaturas',
      href: '/subscriptions',
    },
    { title: 'Empréstimos', description: 'Gerencie seus empréstimos', href: '/loans' },
  ]

  const quickActions: QuickAction[] = [
    { title: 'Conectar Conta', onClick: handleConnect },
    { title: 'Adicionar Meta', href: '/goals/new' },
    { title: 'Novo Orçamento', href: '/budget/new' },
  ]

  // Calcular KPIs principais
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)
  
  // Obter início e fim do mês atual em timezone brasileiro
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
  
  const monthlyIncome = transactions
    .filter(t => {
      const transactionDate = new Date(t.date)
      return t.amount > 0 && transactionDate >= startOfMonth && transactionDate <= endOfMonth
    })
    .reduce((sum, t) => sum + t.amount, 0)
  
  const monthlyExpenses = transactions
    .filter(t => {
      const transactionDate = new Date(t.date)
      return t.amount < 0 && transactionDate >= startOfMonth && transactionDate <= endOfMonth
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  
  const monthlyResult = monthlyIncome - monthlyExpenses

  // Próximos vencimentos de todas as fontes
  const upcomingPayments = [
    ...subscriptions
      .filter(s => s.nextBillingDate && isUpcoming(s.nextBillingDate, 7))
      .map(s => ({ type: 'Assinatura', name: s.name, date: s.nextBillingDate, amount: s.price })),
    ...loans
      .filter(l => l.dueDate && isUpcoming(l.dueDate, 7) && !l.isPaid)
      .map(l => ({ type: 'Empréstimo', name: l.description, date: l.dueDate, amount: l.amount }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* KPIs Principais */}
      {loading ? (
        <KPISkeleton />
      ) : (
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
            <div className={`text-2xl font-bold ${
              monthlyResult >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrencyWithSign(monthlyResult, true).value}
            </div>
            <div className="text-sm text-slate-400">Resultado</div>
          </LiquidCard>
        </motion.div>
      )}

      {/* Próximos Vencimentos */}
      {loading ? (
        <CardSkeleton />
      ) : upcomingPayments.length > 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <LiquidCard>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="text-yellow-400 mr-2">⚠️</span>
              Próximos Vencimentos
            </h2>
            <div className="space-y-2">
              {upcomingPayments.slice(0, 5).map((payment, index) => {
                const status = isOverdue(payment.date) ? 'Vencido' : 
                             isUpcoming(payment.date, 1) ? 'Hoje/Amanhã' : 'Próximo'
                return (
                  <div key={index} className="flex justify-between items-center p-2 bg-card-glass/30 rounded-lg">
                    <div>
                      <span className="font-medium">{payment.name}</span>
                      <span className="text-slate-400 text-sm ml-2">({payment.type})</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        isOverdue(payment.date) ? 'text-red-400' : 
                        isUpcoming(payment.date, 1) ? 'text-yellow-400' : 'text-blue-400'
                      }`}>
                        {formatDate(payment.date)}
                      </div>
                      <div className="text-sm text-slate-300">
                        {formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </LiquidCard>
        </motion.div>
      ) : !loading && (
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-green-400 mr-2">✅</span>
            Próximos Vencimentos
          </h2>
          <EmptyUpcomingPayments />
        </LiquidCard>
      )}

      <QuickActions actions={quickActions} />
      <QuickAccess items={quickAccessItems} />
      <div className="grid md:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Contas</h2>
          {loading ? (
            <>
              <ChartSkeleton height="200px" />
              <div className="mt-4 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="bg-card-glass/30 h-4 w-24 rounded animate-pulse"></div>
                    <div className="bg-card-glass/30 h-4 w-16 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </>
          ) : accounts.length === 0 ? (
            <EmptyAccounts onConnect={handleConnect} />
          ) : (
            <>
              <div className="mb-4" style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                      <Pie data={accounts} dataKey="balance" nameKey="name" outerRadius={80}>
                        {accounts.map((_, i) => (
                          <Cell key={i} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Pie>
                    <Tooltip 
                      formatter={(value, name) => [formatCurrency(Number(value)), name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="text-sm mb-4 space-y-1">
                {accounts.map((a) => (
                  <li key={a.id} className="flex justify-between">
                    <span>{a.name}</span>
                    <span className="font-semibold">{formatCurrency(a.balance)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          <LiquidButton onClick={handleConnect} disabled={!sdkReady || loading}>
            {loading ? 'Carregando...' : 'Conectar Conta'}
          </LiquidButton>
        </LiquidCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
            <EmptyTransactions onConnect={handleConnect} />
          ) : (
            <>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={transactions}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => formatDateShort(d)}
                      hide={transactions.length > 10}
                    />
                    <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                    <Tooltip 
                      labelFormatter={(d) => formatDate(d)}
                      formatter={(value) => [formatCurrency(Number(value)), 'Valor']}
                    />
                      <Bar dataKey="amount" fill={chartColors[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ul className="text-sm mt-4 space-y-1 max-h-48 overflow-auto">
                {transactions.slice(0, 10).map((t) => {
                  const currencyData = formatCurrencyWithSign(t.amount)
                  return (
                    <li
                      key={t.id}
                      className="flex justify-between items-center p-2 hover:bg-card-glass/20 rounded"
                    >
                      <div>
                        <div className="font-medium">{t.description}</div>
                        <div className="text-slate-400 text-xs">{formatDate(t.date)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`font-semibold ${currencyData.className}`}>
                          {currencyData.value}
                        </div>
                        <LiquidButton
                          size="sm"
                          variant="outline"
                          className="text-xs px-3 py-1"
                          onClick={() => handleOpenTransactionModal(t.id)}
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
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Evolução de Saldos</h2>
          {loading ? (
            <ChartSkeleton height="200px" />
          ) : balanceData.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl block mb-2">📈</span>
              <p>Dados insuficientes para gerar gráfico</p>
              <p className="text-sm">Adicione transações para ver a evolução</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={balanceData}>
                  <XAxis dataKey="date" tickFormatter={(d) => formatDateShort(d)} />
                  <YAxis tickFormatter={(v) => formatCurrency(Number(v))} />
                  <Tooltip 
                    labelFormatter={(d) => formatDate(d)}
                    formatter={(value) => [formatCurrency(Number(value)), 'Saldo']}
                  />
                    <Line type="monotone" dataKey="balance" stroke={chartColors[1]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </LiquidCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <LiquidCard>
          <h2 className="text-xl font-semibold mb-2">Despesas por Categoria</h2>
          {loading ? (
            <ChartSkeleton height="200px" />
          ) : categoryData.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <span className="text-4xl block mb-2">🏷️</span>
              <p>Nenhuma despesa por categoria</p>
              <p className="text-sm">Adicione transações de despesas para ver o resumo</p>
            </div>
          ) : (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" outerRadius={80}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                  <Tooltip 
                    formatter={(value, name) => [formatCurrency(Number(value)), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </LiquidCard>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
            <TransactionCalendar days={calendarData} />
          )}
        </LiquidCard>
      </motion.div>

      {/* Novos componentes liquid glass disponíveis em components/ui/liquid-glass-button.tsx */}
      </div>

      {isTransactionModalOpen && (
        <TransactionForm
          transaction={transactionFormData ?? undefined}
          onSubmit={handleUpdateTransaction}
          onCancel={closeTransactionModal}
          loading={loadingTransactionForm}
          submitting={savingTransaction}
        />
      )}
    </motion.div>
  )
}
