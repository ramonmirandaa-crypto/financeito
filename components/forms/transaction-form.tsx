'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LiquidInput } from '@/components/ui/liquid-input'
import { formatDateToISODate } from '@/lib/format-utils'

export interface TransactionFormData {
  id?: string
  description: string
  category?: string | null
  amount: number
  date: string
  accountId: string
}

interface TransactionFormProps {
  transaction?: TransactionFormData | null
  onSubmit: (transaction: TransactionFormData) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
  submitting?: boolean
  accounts: Array<{ id: string; name: string }>
  onCreateManualAccount: () => Promise<{ id: string; name: string }>
}

const ensureDateValue = (value?: string | null) => formatDateToISODate(value)

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  loading,
  submitting,
  accounts,
  onCreateManualAccount,
}: TransactionFormProps) {
  const [formValues, setFormValues] = useState({
    id: transaction?.id,
    description: transaction?.description ?? '',
    category: transaction?.category ?? '',
    date: ensureDateValue(transaction?.date),
    accountId: transaction?.accountId ?? '',
  })
  const [amountInput, setAmountInput] = useState(() =>
    transaction?.amount !== undefined && transaction?.amount !== null
      ? String(transaction.amount)
      : ''
  )
  const [creatingManualAccount, setCreatingManualAccount] = useState(false)

  useEffect(() => {
    if (!transaction) return

    setFormValues({
      id: transaction.id,
      description: transaction.description ?? '',
      category: transaction.category ?? '',
      date: ensureDateValue(transaction.date),
      accountId: transaction.accountId ?? '',
    })

    setAmountInput(
      transaction.amount !== undefined && transaction.amount !== null
        ? String(transaction.amount)
        : ''
    )
  }, [transaction])

  useEffect(() => {
    setFormValues((prev) => {
      if (prev.accountId || accounts.length === 0) {
        return prev
      }

      return { ...prev, accountId: accounts[0].id }
    })
  }, [accounts])

  const isSaving = Boolean(submitting)
  const showLoadingState = Boolean(loading && !transaction)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loading || submitting) return

    const normalizedAmount = Number((amountInput || '').replace(',', '.'))
    if (!Number.isFinite(normalizedAmount)) {
      window.alert('Informe um valor numérico válido para a transação.')
      return
    }

    const trimmedDescription = formValues.description.trim()
    if (!trimmedDescription) {
      window.alert('A descrição da transação é obrigatória.')
      return
    }

    if (!formValues.accountId) {
      window.alert('Selecione uma conta bancária para a transação.')
      return
    }

    onSubmit({
      id: formValues.id,
      description: trimmedDescription,
      category: formValues.category?.trim() || null,
      amount: normalizedAmount,
      date: formValues.date,
      accountId: formValues.accountId,
    })
  }

  const handleCreateManualAccount = async () => {
    if (creatingManualAccount) return

    try {
      setCreatingManualAccount(true)
      const account = await onCreateManualAccount()
      if (account?.id) {
        setFormValues((prev) => ({ ...prev, accountId: account.id }))
      }
    } catch (error) {
      console.error('Erro ao criar conta manual:', error)
      window.alert('Não foi possível criar uma conta manual. Tente novamente.')
    } finally {
      setCreatingManualAccount(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <LiquidCard>
          {showLoadingState ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="h-10 w-10 rounded-full border-b-2 border-primary animate-spin" />
              <p className="text-sm text-slate-300">Carregando transação...</p>
              <LiquidButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCancel}
              >
                Cancelar
              </LiquidButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-white">
                  {transaction?.id ? 'Editar Transação' : 'Transação'}
                </h3>
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-slate-400 hover:text-white transition-colors"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Descrição *
                </label>
                <LiquidInput
                  type="text"
                  value={formValues.description}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Ex: Compra no supermercado"
                  required
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoria
                </label>
                <LiquidInput
                  type="text"
                  value={formValues.category}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      category: event.target.value,
                    }))
                  }
                  placeholder="Ex: Alimentação"
                  disabled={isSaving}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conta *
                </label>
                {accounts.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={formValues.accountId}
                      onChange={(event) =>
                        setFormValues((prev) => ({
                          ...prev,
                          accountId: event.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      required
                      disabled={isSaving || creatingManualAccount}
                    >
                      <option value="" disabled>
                        Selecione uma conta
                      </option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name}
                        </option>
                      ))}
                    </select>
                    <LiquidButton
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCreateManualAccount}
                      disabled={isSaving || creatingManualAccount}
                    >
                      {creatingManualAccount
                        ? 'Criando conta...'
                        : 'Criar conta manual padrão'}
                    </LiquidButton>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-400">
                      Nenhuma conta disponível. Crie uma conta manual para continuar.
                    </p>
                    <LiquidButton
                      type="button"
                      onClick={handleCreateManualAccount}
                      disabled={creatingManualAccount}
                    >
                      {creatingManualAccount ? 'Criando conta...' : 'Criar conta manual padrão'}
                    </LiquidButton>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Valor *
                  </label>
                  <LiquidInput
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={amountInput}
                    onChange={(event) => setAmountInput(event.target.value)}
                    placeholder="0,00"
                    required
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data *
                  </label>
                  <LiquidInput
                    type="date"
                    value={formValues.date}
                    onChange={(event) =>
                      setFormValues((prev) => ({
                        ...prev,
                        date: ensureDateValue(event.target.value),
                      }))
                    }
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <LiquidButton
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  disabled={isSaving}
                >
                  Cancelar
                </LiquidButton>
                <LiquidButton type="submit" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </LiquidButton>
              </div>
            </form>
          )}
        </LiquidCard>
      </motion.div>
    </div>
  )
}
