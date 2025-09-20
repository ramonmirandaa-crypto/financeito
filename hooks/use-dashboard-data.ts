'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useToast } from '@/hooks/use-toast'
import { createHandleConnect } from '@/lib/pluggy-connect'
import {
  normalizeTransaction,
  toTransactionFormData,
  type NormalizedTransaction,
} from '@/lib/transactions'
import type {
  ManualAccountOption,
  TransactionFormData,
} from '@/components/forms/transaction-form'
import type { ManualAccountFormData } from '@/components/forms/manual-account-form'
import type { QuickAction } from '@/components/quick-actions'
import { navigationItems } from '@/config/navigation'
import type { QuickAccessItem } from '@/config/navigation'
import type { TransactionCalendarDay } from '@/components/transactions/transaction-calendar'
import {
  formatDateToISODate,
  isUpcoming,
} from '@/lib/format-utils'

interface UpcomingPayment {
  type: string
  name: string
  date: string
  amount: number
}

interface LoadDataOptions {
  silent?: boolean
}

export const useDashboardData = () => {
  const [accounts, setAccounts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [goals, setGoals] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loans, setLoans] = useState<any[]>([])
  const [sdkReady, setSdkReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false)
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null)
  const [transactionFormData, setTransactionFormData] =
    useState<TransactionFormData | null>(null)
  const [loadingTransactionForm, setLoadingTransactionForm] = useState(false)
  const [savingTransaction, setSavingTransaction] = useState(false)
  const [manualAccountModalOpen, setManualAccountModalOpen] = useState(false)
  const [savingManualAccount, setSavingManualAccount] = useState(false)

  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const { toast } = useToast()

  const loadData = useCallback(
    async ({ silent = false }: LoadDataOptions = {}) => {
      if (!silent) {
        setLoading(true)
      }

      try {
        const pluggyResponse = await fetch('/api/pluggy/sync')

        if (pluggyResponse.status === 401) {
          window.location.href = '/login'
          return
        }

        if (pluggyResponse.ok) {
          const json = await pluggyResponse.json()
          setAccounts(
            (json.accounts || []).map((account: any) => ({
              ...account,
              balance: Number(account.balance),
            })),
          )
          setTransactions(
            (json.transactions || []).map((transaction: any) =>
              normalizeTransaction(transaction),
            ),
          )
        }

        const [budgetRes, goalsRes, subscriptionsRes, loansRes] = await Promise.all([
          fetch('/api/budget'),
          fetch('/api/goals'),
          fetch('/api/subscriptions'),
          fetch('/api/loans'),
        ])

        if (budgetRes.ok) {
          setBudgets(await budgetRes.json())
        }
        if (goalsRes.ok) {
          setGoals(await goalsRes.json())
        }
        if (subscriptionsRes.ok) {
          setSubscriptions(await subscriptionsRes.json())
        }
        if (loansRes.ok) {
          setLoans(await loansRes.json())
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast.error(
          'Erro ao carregar dados',
          'Não foi possível carregar suas informações financeiras. Tente novamente.',
          { duration: 5000 },
        )
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [toast],
  )

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      router.push('/login')
      return
    }

    loadData()
  }, [isLoaded, isSignedIn, router, loadData])

  useEffect(() => {
    if ((window as any).PluggyConnect) {
      setSdkReady(true)
      return
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src="https://connect.pluggy.ai/sdk.js"]',
    )
    const handler = () => setSdkReady(true)
    script?.addEventListener('load', handler)
    return () => script?.removeEventListener('load', handler)
  }, [])

  const closeTransactionModal = useCallback(() => {
    setIsTransactionModalOpen(false)
    setSelectedTransactionId(null)
    setTransactionFormData(null)
    setLoadingTransactionForm(false)
    setSavingTransaction(false)
  }, [])

  const handleOpenNewTransactionModal = useCallback(() => {
    setSelectedTransactionId(null)
    setTransactionFormData(null)
    setIsTransactionModalOpen(true)
    setLoadingTransactionForm(false)
    setSavingTransaction(false)
  }, [])

  const handleOpenTransactionModal = useCallback(
    async (transactionId: string) => {
      const existingTransaction = transactions.find(
        (transaction) => transaction.id === transactionId,
      )
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
          'Não foi possível carregar os dados da transação selecionada.',
        )
        if (!existingTransaction) {
          closeTransactionModal()
        }
      } finally {
        setLoadingTransactionForm(false)
      }
    },
    [transactions, toast, closeTransactionModal],
  )

  const handleSubmitTransaction = useCallback(
    async (values: TransactionFormData) => {
      const isEditing = Boolean(selectedTransactionId)
      const previousTransaction = isEditing
        ? transactions.find(
            (transaction) => transaction.id === selectedTransactionId,
          )
        : null
      setSavingTransaction(true)

      try {
        const trimmedCategory =
          typeof values.category === 'string' ? values.category.trim() : ''

        const response = await fetch(
          isEditing ? `/api/transactions/${selectedTransactionId}` : '/api/transactions',
          {
            method: isEditing ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description: values.description.trim(),
              category: trimmedCategory || null,
              amount: values.amount,
              date: values.date,
              accountId: values.accountId || null,
            }),
          },
        )

        if (!response.ok) {
          throw new Error('Failed to save transaction')
        }

        const data = await response.json()
        const normalized = normalizeTransaction(data)

        setTransactions((prev) => {
          if (isEditing) {
            return prev.map((transaction) =>
              transaction.id === normalized.id
                ? { ...transaction, ...normalized }
                : transaction,
            )
          }

          return [normalized, ...prev].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
        })

        setAccounts((prev) => {
          const previousManualAccountId =
            previousTransaction && previousTransaction.accountId
              ? prev.find(
                  (account) =>
                    account.id === previousTransaction.accountId &&
                    account.provider === 'manual',
                )
                ? previousTransaction.accountId
                : null
              : null
          const previousAmount = Number(previousTransaction?.amount ?? 0)

          return prev.map((account) => {
            if (account.provider !== 'manual') {
              return account
            }

            const currentBalance = Number(account.balance ?? 0)

            if (account.id === normalized.accountId) {
              const adjustment =
                isEditing && previousManualAccountId === normalized.accountId
                  ? normalized.amount - previousAmount
                  : normalized.amount
              return { ...account, balance: currentBalance + adjustment }
            }

            if (
              isEditing &&
              previousManualAccountId &&
              account.id === previousManualAccountId &&
              previousManualAccountId !== normalized.accountId
            ) {
              return { ...account, balance: currentBalance - previousAmount }
            }

            return account
          })
        })

        toast.success(
          isEditing ? 'Transação atualizada' : 'Transação criada',
          isEditing
            ? 'As alterações foram salvas com sucesso.'
            : 'A transação foi adicionada com sucesso.',
        )

        closeTransactionModal()
        await loadData({ silent: true })
      } catch (error) {
        console.error('Erro ao salvar transação:', error)
        toast.error(
          isEditing ? 'Erro ao atualizar transação' : 'Erro ao criar transação',
          isEditing
            ? 'Não foi possível salvar as alterações. Tente novamente.'
            : 'Não foi possível registrar a transação. Tente novamente.',
        )
      } finally {
        setSavingTransaction(false)
      }
    },
    [selectedTransactionId, transactions, toast, closeTransactionModal, loadData],
  )

  const manualAccountOptions = useMemo<ManualAccountOption[]>(
    () =>
      accounts
        .filter((account) => account.provider === 'manual')
        .map((account) => ({
          id: account.id,
          name: account.name,
          currency: account.currency,
          balance: Number(account.balance ?? 0),
        })),
    [accounts],
  )

  const handleOpenManualAccountModal = useCallback(() => {
    setManualAccountModalOpen(true)
  }, [])

  const closeManualAccountModal = useCallback(() => {
    setManualAccountModalOpen(false)
    setSavingManualAccount(false)
  }, [])

  const handleSubmitManualAccount = useCallback(
    async (values: ManualAccountFormData) => {
      setSavingManualAccount(true)
      try {
        const response = await fetch('/api/manual-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: values.name,
            type: values.type,
            currency: values.currency,
            balance: values.balance,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to create manual account')
        }

        const data = await response.json()

        setAccounts((prev) => [
          {
            id: data.id,
            name: data.name,
            provider: 'manual',
            providerItem: data.type ?? null,
            currency: data.currency,
            balance: Number(data.balance ?? 0),
            mask: null,
            data: data.type ? { type: data.type } : null,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          },
          ...prev,
        ])

        toast.success(
          'Conta offline criada',
          'Sua conta manual foi adicionada com sucesso.',
        )

        closeManualAccountModal()
        await loadData({ silent: true })
      } catch (error) {
        console.error('Erro ao criar conta manual:', error)
        toast.error(
          'Erro ao criar conta manual',
          'Não foi possível adicionar a conta offline. Tente novamente.',
        )
      } finally {
        setSavingManualAccount(false)
      }
    },
    [toast, closeManualAccountModal, loadData],
  )

  const balanceData = useMemo(
    () =>
      transactions
        .slice()
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        )
        .reduce<{ date: string; balance: number }[]>((acc, transaction) => {
          const prevBalance = acc.length ? acc[acc.length - 1].balance : 0
          acc.push({
            date: transaction.date,
            balance: prevBalance + transaction.amount,
          })
          return acc
        }, []),
    [transactions],
  )

  const categoryData = useMemo(
    () => {
      const categoryMap: Record<string, number> = {}
      transactions
        .filter((transaction) => transaction.amount < 0)
        .forEach((transaction) => {
          const category =
            transaction.category || transaction.providerCategoryName || 'Outros'
          categoryMap[category] =
            (categoryMap[category] || 0) + Math.abs(transaction.amount)
        })

      return Object.entries(categoryMap).map(([name, value]) => ({
        name,
        value,
      }))
    },
    [transactions],
  )

  const calendarData = useMemo<TransactionCalendarDay[]>(
    () =>
      Object.values(
        transactions.reduce<Record<string, TransactionCalendarDay>>(
          (acc, transaction) => {
            const normalizedDate = formatDateToISODate(transaction.date)

            const current = acc[normalizedDate] ?? {
              date: normalizedDate,
              income: 0,
              expense: 0,
            }

            acc[normalizedDate] = {
              ...current,
              income: current.income + (transaction.amount >= 0 ? transaction.amount : 0),
              expense:
                current.expense +
                (transaction.amount < 0 ? Math.abs(transaction.amount) : 0),
            }

            return acc
          },
          {},
        ),
      ).sort((a, b) => a.date.localeCompare(b.date)),
    [transactions],
  )

  const quickAccessItems = useMemo<QuickAccessItem[]>(
    () =>
      navigationItems.flatMap((item) => item.quickAccessItems ?? [])
        .filter((shortcut, index, array) => {
          const firstIndex = array.findIndex((candidate) => candidate.href === shortcut.href)

          return firstIndex === index
        }),
    [],
  )

  const connectDisabled = useMemo(
    () => !sdkReady || loading,
    [sdkReady, loading],
  )

  const handleConnect = useMemo(
    () =>
      createHandleConnect({
        toast,
        onAfterSync: loadData,
      }),
    [toast, loadData],
  )

  const quickActions = useMemo<QuickAction[]>(
    () => [
      { title: 'Nova Transação', onClick: handleOpenNewTransactionModal },
      { title: 'Nova Conta Offline', onClick: handleOpenManualAccountModal },
      { title: 'Conectar Conta', onClick: handleConnect, disabled: connectDisabled },
      { title: 'Adicionar Meta', onClick: () => router.push('/goals?create=1') },
      { title: 'Novo Orçamento', onClick: () => router.push('/budget?create=1') },
    ],
    [
      handleOpenManualAccountModal,
      handleOpenNewTransactionModal,
      handleConnect,
      connectDisabled,
      router,
    ],
  )

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.balance ?? 0), 0),
    [accounts],
  )

  const monthlyMetrics = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    const startOfMonth = new Date(currentYear, currentMonth, 1)
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)

    const monthlyIncome = transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return (
          transaction.amount > 0 &&
          transactionDate >= startOfMonth &&
          transactionDate <= endOfMonth
        )
      })
      .reduce((sum, transaction) => sum + transaction.amount, 0)

    const monthlyExpenses = transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return (
          transaction.amount < 0 &&
          transactionDate >= startOfMonth &&
          transactionDate <= endOfMonth
        )
      })
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

    return {
      monthlyIncome,
      monthlyExpenses,
      monthlyResult: monthlyIncome - monthlyExpenses,
    }
  }, [transactions])

  const upcomingPayments = useMemo<UpcomingPayment[]>(
    () => [
      ...subscriptions
        .filter(
          (subscription) =>
            subscription.nextBilling &&
            isUpcoming(subscription.nextBilling, 7),
        )
        .map((subscription) => ({
          type: 'Assinatura',
          name: subscription.name,
          date: subscription.nextBilling,
          amount: subscription.amount,
        })),
      ...loans
        .filter(
          (loan) =>
            loan.dueDate &&
            isUpcoming(loan.dueDate, 7) &&
            !loan.isPaid,
        )
        .map((loan) => ({
          type: 'Empréstimo',
          name: loan.description,
          date: loan.dueDate,
          amount: loan.amount,
        })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [subscriptions, loans],
  )

  return {
    accounts,
    transactions,
    budgets,
    goals,
    subscriptions,
    loans,
    loading,
    quickActions,
    quickAccessItems,
    connectDisabled,
    balanceData,
    categoryData,
    calendarData,
    totalBalance,
    monthlyIncome: monthlyMetrics.monthlyIncome,
    monthlyExpenses: monthlyMetrics.monthlyExpenses,
    monthlyResult: monthlyMetrics.monthlyResult,
    upcomingPayments,
    isTransactionModalOpen,
    transactionFormData,
    loadingTransactionForm,
    savingTransaction,
    manualAccountOptions,
    manualAccountModalOpen,
    savingManualAccount,
    handleOpenTransactionModal,
    handleOpenNewTransactionModal,
    closeTransactionModal,
    handleSubmitTransaction,
    handleOpenManualAccountModal,
    closeManualAccountModal,
    handleSubmitManualAccount,
    handleConnect,
    loadData,
  }
}

export type UseDashboardDataReturn = ReturnType<typeof useDashboardData>
