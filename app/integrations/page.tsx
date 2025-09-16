'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { useToast } from '@/hooks/use-toast'
import { createHandleConnect } from '@/lib/pluggy-connect'
import { formatCurrency, formatDateTime } from '@/lib/format-utils'

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

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
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
        throw new Error('Failed to load accounts')
      }

      const json = await response.json()
      const parsedAccounts = (json.accounts || []).map((account: any) => ({
        ...account,
        balance: Number(account.balance ?? 0),
      })) as BankAccount[]

      setAccounts(parsedAccounts)
    } catch (error) {
      console.error('Erro ao carregar contas Pluggy:', error)
      toast.error(
        'Erro ao carregar contas',
        'Não foi possível carregar suas contas conectadas. Tente novamente em instantes.',
        { duration: 5000 }
      )
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
    </motion.div>
  )
}
