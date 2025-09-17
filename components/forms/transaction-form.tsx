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
  accountId?: string | null
}

interface TransactionFormProps {
  transaction?: TransactionFormData | null
  onSubmit: (transaction: TransactionFormData) => Promise<void> | void
  onCancel: () => void
  loading?: boolean
  submitting?: boolean
  manualAccounts: ManualAccountOption[]
}

const ensureDateValue = (value?: string | null) => formatDateToISODate(value)

type FormState = {
  id?: string
  description: string
  category: string
  date: string
  accountId: string
}

export interface ManualAccountOption {
  id: string
  name: string
  currency?: string
  balance?: number
}

const createInitialFormState = (
  transaction: TransactionFormData | null | undefined,
  defaultAccountId: string
): FormState => ({
  id: transaction?.id,
  description: transaction?.description ?? '',
  category: transaction?.category ?? '',
  date: ensureDateValue(transaction?.date),
  accountId: transaction?.accountId ?? defaultAccountId,
})

const createInitialAmount = (transaction?: TransactionFormData | null) =>
  transaction?.amount !== undefined && transaction?.amount !== null
    ? String(transaction.amount)
    : ''

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  loading,
  submitting,
  manualAccounts,
}: TransactionFormProps) {
  const defaultAccountId = manualAccounts[0]?.id ?? ''
  const [formValues, setFormValues] = useState<FormState>(() =>
    createInitialFormState(transaction, defaultAccountId)
  )
  const [amountInput, setAmountInput] = useState<string>(() =>
    createInitialAmount(transaction)
  )

  const isEditing = Boolean(formValues.id)

  useEffect(() => {
    if (!transaction) {
      setFormValues(createInitialFormState(null, manualAccounts[0]?.id ?? ''))
      setAmountInput('')
      return
    }

    setFormValues(createInitialFormState(transaction, manualAccounts[0]?.id ?? ''))
    setAmountInput(createInitialAmount(transaction))
  }, [transaction, manualAccounts])

  useEffect(() => {
    if (transaction || formValues.accountId) {
      return
    }

    if (manualAccounts.length > 0) {
      setFormValues((prev) => ({
        ...prev,
        accountId: prev.accountId || manualAccounts[0].id,
      }))
    }
  }, [manualAccounts, transaction, formValues.accountId])

  const isSaving = Boolean(submitting)
  const showLoadingState = Boolean(loading && !transaction)
  const hasManualAccounts = manualAccounts.length > 0
  const currentAccountIsManual = formValues.accountId
    ? manualAccounts.some((account) => account.id === formValues.accountId)
    : false
  const allowNonManualSelection = Boolean(formValues.accountId && !currentAccountIsManual)

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

    const selectedAccountId = formValues.accountId?.trim() || ''
    if (hasManualAccounts && !selectedAccountId) {
      window.alert('Selecione uma conta offline para registrar a transação.')
      return
    }

    const payload: TransactionFormData = {
      description: trimmedDescription,
      category: formValues.category?.trim() || null,
      amount: normalizedAmount,
      date: formValues.date,
      accountId: selectedAccountId || null,
    }

    if (formValues.id) {
      payload.id = formValues.id
    }

    onSubmit(payload)
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
                  {isEditing ? 'Editar Transação' : 'Nova Transação'}
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
                  Conta offline {hasManualAccounts ? '*' : ''}
                </label>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formValues.accountId}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      accountId: event.target.value,
                    }))
                  }
                  required={hasManualAccounts && !allowNonManualSelection}
                  disabled={
                    isSaving || (!hasManualAccounts && !allowNonManualSelection)
                  }
                >
                  <option value="">
                    {hasManualAccounts
                      ? 'Selecione a conta que receberá a transação'
                      : 'Nenhuma conta manual disponível'}
                  </option>
                  {!currentAccountIsManual && formValues.accountId && (
                    <option value={formValues.accountId} disabled>
                      Conta conectada (somente leitura)
                    </option>
                  )}
                  {manualAccounts.map((accountOption) => (
                    <option key={accountOption.id} value={accountOption.id}>
                      {accountOption.name}
                    </option>
                  ))}
                </select>
                {!hasManualAccounts && (
                  <p className="mt-2 text-xs text-slate-400">
                    Crie uma conta offline para organizar seus lançamentos manuais.
                    Caso continue, criaremos uma conta padrão automaticamente.
                  </p>
                )}
                {allowNonManualSelection && (
                  <p className="mt-2 text-xs text-slate-400">
                    Esta transação pertence a uma conta conectada. Se desejar, escolha
                    uma conta offline para movê-la manualmente.
                  </p>
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
                  {isSaving
                    ? 'Salvando...'
                    : isEditing
                      ? 'Salvar Alterações'
                      : 'Adicionar Transação'}
                </LiquidButton>
              </div>
            </form>
          )}
        </LiquidCard>
      </motion.div>
    </div>
  )
}
