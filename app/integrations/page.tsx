'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { useToast } from '@/hooks/use-toast'
import { createHandleConnect } from '@/lib/pluggy-connect'
import { formatCurrency, formatDateTime } from '@/lib/format-utils'
import {
  ManualAccountForm,
  ManualAccountFormData,
} from '@/components/forms/manual-account-form'

interface BankAccount {
  id: string
  name: string
  provider: string
  providerItem?: string | null
  currency: string
  balance: number
  mask?: string | null
  updatedAt: string
  createdAt: string
  data?: Record<string, any> | null
}

interface ManualAccount {
  id: string
  name: string
  currency: string
  balance: number
  type?: string | null
  createdAt: string
  updatedAt: string
}

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [manualAccounts, setManualAccounts] = useState<ManualAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [manualAccountModalOpen, setManualAccountModalOpen] = useState(false)
  const [manualAccountFormData, setManualAccountFormData] =
    useState<ManualAccountFormData | null>(null)
  const [savingManualAccount, setSavingManualAccount] = useState(false)
  const [deletingManualAccountId, setDeletingManualAccountId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadAccounts = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (silent) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await fetch('/api/pluggy/sync')

      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        let message = 'Não foi possível carregar suas contas conectadas. Verifique a configuração da integração.'
        try {
          const data = await response.json()
          if (data?.error) {
            message = data.error
          }
        } catch (parseError) {
          console.error('Falha ao interpretar resposta de erro do Pluggy:', parseError)
        }
        throw new Error(message)
      }

      const json = await response.json()
      const parsedAccounts = (json.accounts || [])
        .filter((account: any) => account.provider !== 'manual')
        .map((account: any) => ({
          ...account,
          balance: Number(account.balance ?? 0),
        })) as BankAccount[]

      setAccounts(parsedAccounts)

      const manualResponse = await fetch('/api/manual-accounts')

      if (manualResponse.status === 401) {
        window.location.href = '/login'
        return
      }

      if (!manualResponse.ok) {
        let message = 'Não foi possível carregar suas contas offline.'
        try {
          const data = await manualResponse.json()
          if (data?.error) {
            message = data.error
          }
        } catch (parseError) {
          console.error('Falha ao interpretar resposta de contas manuais:', parseError)
        }
        throw new Error(message)
      }

      const manualJson = await manualResponse.json()
      const parsedManualAccounts = (Array.isArray(manualJson) ? manualJson : []).map(
        (account: any) => ({
          id: account.id,
          name: account.name,
          currency: account.currency,
          balance: Number(account.balance ?? 0),
          type: account.type ?? null,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
        })
      ) as ManualAccount[]

      setManualAccounts(parsedManualAccounts)
    } catch (error) {
      console.error('Erro ao carregar contas Pluggy:', error)
      setManualAccounts([])
      const description =
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível carregar suas contas conectadas. Tente novamente em instantes.'
      toast.error('Erro ao carregar contas', description, { duration: 5000 })
    } finally {
      if (silent) {
        setRefreshing(false)
      } else {
        setLoading(false)
      }
    }
  }, [toast])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  useEffect(() => {
    if ((window as any).PluggyConnect) {
      setSdkReady(true)
      return
    }

    const script = document.querySelector<HTMLScriptElement>('script[src="https://connect.pluggy.ai/sdk.js"]')
    const handler = () => setSdkReady(true)
    script?.addEventListener('load', handler)
    return () => script?.removeEventListener('load', handler)
  }, [])

  const handleConnect = useMemo(
    () => createHandleConnect({ toast, onAfterSync: () => loadAccounts({ silent: true }) }),
    [toast, loadAccounts]
  )

  const handleDisconnect = useCallback(
    async (accountId: string) => {
      setDisconnectingId(accountId)

      try {
        const response = await fetch(`/api/pluggy/sync?accountId=${accountId}`, { method: 'DELETE' })

        if (response.status === 401) {
          window.location.href = '/login'
          return
        }

        if (!response.ok) {
          throw new Error('Failed to disconnect account')
        }

        toast.success(
          'Conta desconectada',
          'A integração foi removida com sucesso.',
          { duration: 4000 }
        )

        await loadAccounts({ silent: true })
      } catch (error) {
        console.error('Erro ao desconectar conta Pluggy:', error)
        toast.error(
          'Erro ao desconectar',
          'Não foi possível remover esta conta. Tente novamente.',
          { duration: 5000 }
        )
      } finally {
        setDisconnectingId(null)
      }
    },
    [toast, loadAccounts]
  )

  const handleOpenManualAccountModal = useCallback(
    (account?: ManualAccount) => {
      if (account) {
        setManualAccountFormData({
          id: account.id,
          name: account.name,
          currency: account.currency,
          balance: account.balance,
          type: account.type ?? null,
        })
      } else {
        setManualAccountFormData(null)
      }
      setManualAccountModalOpen(true)
    },
    []
  )

  const closeManualAccountModal = useCallback(() => {
    setManualAccountModalOpen(false)
    setManualAccountFormData(null)
    setSavingManualAccount(false)
  }, [])

  const handleSubmitManualAccount = useCallback(
    async (values: ManualAccountFormData) => {
      setSavingManualAccount(true)
      const isEditing = Boolean(values.id)

      try {
        const response = await fetch(
          isEditing ? `/api/manual-accounts/${values.id}` : '/api/manual-accounts',
          {
            method: isEditing ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: values.name,
              type: values.type,
              currency: values.currency,
              balance: values.balance,
            }),
          }
        )

        if (!response.ok) {
          throw new Error('Failed to save manual account')
        }

        toast.success(
          isEditing ? 'Conta offline atualizada' : 'Conta offline criada',
          isEditing
            ? 'As alterações foram salvas com sucesso.'
            : 'A conta manual foi adicionada com sucesso.'
        )

        closeManualAccountModal()
        await loadAccounts({ silent: true })
      } catch (error) {
        console.error('Erro ao salvar conta manual:', error)
        toast.error(
          isEditing ? 'Erro ao atualizar conta offline' : 'Erro ao criar conta offline',
          isEditing
            ? 'Não foi possível salvar as alterações. Tente novamente.'
            : 'Não foi possível adicionar a conta manual. Tente novamente.'
        )
      } finally {
        setSavingManualAccount(false)
      }
    },
    [closeManualAccountModal, loadAccounts, toast]
  )

  const handleDeleteManualAccount = useCallback(
    async (accountId: string) => {
      const confirmed = window.confirm(
        'Tem certeza de que deseja remover esta conta offline? Todos os lançamentos associados serão apagados.'
      )
      if (!confirmed) {
        return
      }

      setDeletingManualAccountId(accountId)
      try {
        const response = await fetch(`/api/manual-accounts/${accountId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to delete manual account')
        }

        toast.success(
          'Conta offline removida',
          'A conta manual foi excluída com sucesso.'
        )

        await loadAccounts({ silent: true })
      } catch (error) {
        console.error('Erro ao remover conta manual:', error)
        toast.error(
          'Erro ao remover conta offline',
          'Não foi possível excluir esta conta. Tente novamente.'
        )
      } finally {
        setDeletingManualAccountId(null)
      }
    },
    [loadAccounts, toast]
  )

  const connectButtonDisabled = !sdkReady || loading || refreshing
  const connectButtonLabel = !sdkReady
    ? 'Carregando SDK...'
    : loading
      ? 'Carregando...'
      : refreshing
        ? 'Atualizando...'
        : 'Conectar Conta'

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="flex flex-wrap items-center justify-between gap-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">🔌 Integrações Bancárias</h1>
          <p className="text-slate-400 mt-1">
            Conecte e gerencie suas contas bancárias sincronizadas com o Financeito.
          </p>
        </div>
        <LiquidButton
          onClick={handleConnect}
          disabled={connectButtonDisabled}
          variant="primary"
          glowColor="#3b82f6"
        >
          {connectButtonLabel}
        </LiquidButton>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <LiquidCard>
          {loading ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-blue-400 border-b-transparent animate-spin"></div>
              <p className="text-slate-400">Carregando contas conectadas...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma conta conectada</h3>
              <p className="text-slate-400 mb-6">
                Conecte sua primeira conta bancária para sincronizar saldos e transações automaticamente.
              </p>
              <LiquidButton
                onClick={handleConnect}
                disabled={connectButtonDisabled}
                variant="primary"
                glowColor="#3b82f6"
              >
                {connectButtonLabel}
              </LiquidButton>
            </div>
          ) : (
            <div className="space-y-4">
              {refreshing && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-3 w-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
                  Atualizando contas conectadas...
                </div>
              )}
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 rounded-2xl border border-card-border/40 bg-card-glass/40 p-4 backdrop-blur-glass md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-semibold text-white">{account.name}</span>
                      {account.mask && (
                        <span className="text-xs text-slate-400">•••• {account.mask}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-slate-100">
                      {formatCurrency(account.balance)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Última atualização em {formatDateTime(account.updatedAt)}
                    </div>
                    <div className="text-xs uppercase text-slate-500">
                      Provedor: {account.provider} · Moeda: {account.currency}
                    </div>
                  </div>
                  <LiquidButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={disconnectingId === account.id}
                  >
                    {disconnectingId === account.id ? 'Removendo...' : 'Desconectar'}
                  </LiquidButton>
                </div>
              ))}
            </div>
          )}
        </LiquidCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <LiquidCard>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">💼 Contas Offline</h2>
              <p className="text-slate-400 text-sm mt-1">
                Cadastre instituições que não possuem integração automática e acompanhe seus saldos manualmente.
              </p>
            </div>
            <LiquidButton
              onClick={() => handleOpenManualAccountModal()}
              variant="primary"
              glowColor="#22c55e"
              disabled={savingManualAccount}
            >
              Nova conta offline
            </LiquidButton>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 h-10 w-10 rounded-full border-2 border-emerald-400 border-b-transparent animate-spin"></div>
              <p className="text-slate-400">Carregando contas offline...</p>
            </div>
          ) : manualAccounts.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-6xl">🗂️</div>
              <h3 className="text-lg font-semibold text-white">Nenhuma conta offline</h3>
              <p className="text-slate-400 text-sm">
                Registre suas contas manuais para acompanhar cartões, investimentos ou carteiras que não possuem Open Finance.
              </p>
              <LiquidButton
                onClick={() => handleOpenManualAccountModal()}
                variant="outline"
                glowColor="#22c55e"
                disabled={savingManualAccount}
              >
                Criar primeira conta manual
              </LiquidButton>
            </div>
          ) : (
            <div className="space-y-4">
              {refreshing && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="h-3 w-3 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"></span>
                  Atualizando contas offline...
                </div>
              )}
              {manualAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col gap-3 rounded-2xl border border-card-border/40 bg-card-glass/40 p-4 backdrop-blur-glass md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="text-lg font-semibold text-white">{account.name}</div>
                    <div className="text-sm font-medium text-slate-100">
                      {formatCurrency(account.balance)}
                    </div>
                    <div className="text-xs text-slate-400">
                      Moeda: {account.currency}
                      {account.type ? ` · Tipo: ${account.type}` : ''}
                    </div>
                    <div className="text-xs text-slate-500">
                      Atualizado em {formatDateTime(account.updatedAt)}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <LiquidButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenManualAccountModal(account)}
                      disabled={savingManualAccount && manualAccountFormData?.id === account.id}
                    >
                      Editar
                    </LiquidButton>
                    <LiquidButton
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-500/40 hover:text-red-200 hover:border-red-300/60"
                      onClick={() => handleDeleteManualAccount(account.id)}
                      disabled={deletingManualAccountId === account.id}
                    >
                      {deletingManualAccountId === account.id ? 'Removendo...' : 'Excluir'}
                    </LiquidButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </LiquidCard>
      </motion.div>

      {manualAccountModalOpen && (
        <ManualAccountForm
          open={manualAccountModalOpen}
          account={manualAccountFormData}
          onClose={closeManualAccountModal}
          onSubmit={handleSubmitManualAccount}
          submitting={savingManualAccount}
        />
      )}
    </motion.div>
  )
}
