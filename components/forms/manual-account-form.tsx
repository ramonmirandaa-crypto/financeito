'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LiquidInput } from '@/components/ui/liquid-input'

export interface ManualAccountFormData {
  id?: string
  name: string
  type?: string | null
  currency: string
  balance: number
}

interface ManualAccountFormProps {
  account?: ManualAccountFormData | null
  open: boolean
  onClose: () => void
  onSubmit: (values: ManualAccountFormData) => Promise<void> | void
  submitting?: boolean
}

const DEFAULT_ACCOUNT_TYPES = [
  { value: 'Conta Corrente', label: 'Conta Corrente' },
  { value: 'Conta Poupança', label: 'Conta Poupança' },
  { value: 'Cartão de Crédito', label: 'Cartão de Crédito' },
  { value: 'Carteira', label: 'Carteira' },
  { value: 'Outro', label: 'Outro' },
]

const DEFAULT_CURRENCIES = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]

const createInitialState = (account?: ManualAccountFormData | null) => ({
  id: account?.id,
  name: account?.name ?? '',
  type: account?.type ?? '',
  currency: account?.currency ?? 'BRL',
})

const createInitialBalance = (account?: ManualAccountFormData | null) =>
  account ? String(account.balance) : ''

export function ManualAccountForm({
  account,
  open,
  onClose,
  onSubmit,
  submitting,
}: ManualAccountFormProps) {
  const [formValues, setFormValues] = useState(() => createInitialState(account))
  const [balanceInput, setBalanceInput] = useState(() => createInitialBalance(account))

  useEffect(() => {
    if (!open) {
      return
    }

    setFormValues(createInitialState(account))
    setBalanceInput(createInitialBalance(account))
  }, [open, account])

  const isEditing = useMemo(() => Boolean(formValues.id), [formValues.id])
  const isSubmitting = Boolean(submitting)

  if (!open) {
    return null
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const normalizedBalance = Number((balanceInput || '').replace(',', '.'))
    if (!Number.isFinite(normalizedBalance)) {
      window.alert('Informe um saldo inicial numérico válido.')
      return
    }

    const trimmedName = formValues.name.trim()
    if (!trimmedName) {
      window.alert('O nome da conta é obrigatório.')
      return
    }

    const payload: ManualAccountFormData = {
      id: formValues.id,
      name: trimmedName,
      type: formValues.type?.trim() || null,
      currency: formValues.currency,
      balance: normalizedBalance,
    }

    onSubmit(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <LiquidCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-white">
                {isEditing ? 'Editar conta offline' : 'Nova conta offline'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome *
              </label>
              <LiquidInput
                type="text"
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex: Banco XPTO"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo da conta
              </label>
              <select
                className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formValues.type}
                onChange={(event) =>
                  setFormValues((prev) => ({
                    ...prev,
                    type: event.target.value,
                  }))
                }
                disabled={isSubmitting}
              >
                <option value="">Selecionar tipo</option>
                {DEFAULT_ACCOUNT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Moeda *
                </label>
                <select
                  className="w-full rounded-md border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formValues.currency}
                  onChange={(event) =>
                    setFormValues((prev) => ({
                      ...prev,
                      currency: event.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                >
                  {DEFAULT_CURRENCIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Saldo inicial *
                </label>
                <LiquidInput
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  value={balanceInput}
                  onChange={(event) => setBalanceInput(event.target.value)}
                  placeholder="0,00"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <LiquidButton
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </LiquidButton>
              <LiquidButton type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Salvando...'
                  : isEditing
                    ? 'Salvar alterações'
                    : 'Criar conta'}
              </LiquidButton>
            </div>
          </form>
        </LiquidCard>
      </motion.div>
    </div>
  )
}
