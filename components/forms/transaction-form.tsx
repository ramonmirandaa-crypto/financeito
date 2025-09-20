'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LiquidInput } from '@/components/ui/liquid-input'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import {
  createTransactionFormValues,
  parseTransactionFormValues,
  transactionFormSchema,
  type TransactionFormData,
  type TransactionFormValues,
} from '@/lib/validation/transaction'

interface TransactionFormProps {
  transaction?: TransactionFormData | null
  onSubmit: (transaction: TransactionFormData) => Promise<void> | void
  onCancel: () => void
  onDelete?: (transactionId: string) => Promise<boolean>
  loading?: boolean
  submitting?: boolean
  manualAccounts: ManualAccountOption[]
}

export interface ManualAccountOption {
  id: string
  name: string
  currency?: string
  balance?: number
}

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  onDelete,
  loading,
  submitting,
  manualAccounts,
}: TransactionFormProps) {
  const defaultAccountId = manualAccounts[0]?.id ?? ''
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: createTransactionFormValues(transaction ?? null, defaultAccountId),
  })

  const accountIdValue = watch('accountId')
  const formId = watch('id')

  useEffect(() => {
    setConfirmDeleteOpen(false)
    setIsDeleting(false)
  }, [transaction?.id])

  useEffect(() => {
    reset(
      createTransactionFormValues(transaction ?? null, manualAccounts[0]?.id ?? ''),
      { keepDirty: false },
    )
  }, [transaction, manualAccounts, reset])

  useEffect(() => {
    if (transaction || accountIdValue) {
      return
    }

    if (manualAccounts.length > 0) {
      setValue('accountId', manualAccounts[0].id, {
        shouldDirty: false,
        shouldValidate: true,
      })
    }
  }, [transaction, accountIdValue, manualAccounts, setValue])

  useEffect(() => {
    if (accountIdValue) {
      clearErrors('accountId')
    }
  }, [accountIdValue, clearErrors])

  const isSaving = Boolean(submitting)
  const showLoadingState = Boolean(loading && !transaction)
  const hasManualAccounts = manualAccounts.length > 0
  const currentAccountIsManual = accountIdValue
    ? manualAccounts.some((account) => account.id === accountIdValue)
    : false
  const allowNonManualSelection = Boolean(accountIdValue && !currentAccountIsManual)
  const manualAccountRequired = hasManualAccounts && !allowNonManualSelection
  const isEditing = Boolean(formId)

  useEffect(() => {
    if (!manualAccountRequired) {
      clearErrors('accountId')
    }
  }, [manualAccountRequired, clearErrors])

  const onValidSubmit = (values: TransactionFormValues) => {
    if (loading || submitting) return

    if (manualAccountRequired && !values.accountId) {
      setError('accountId', {
        type: 'manual',
        message: 'Selecione uma conta offline para registrar a transação.',
      })
      return
    }

    try {
      const payload = parseTransactionFormValues(values)
      onSubmit(payload)
    } catch (error) {
      console.error('Erro ao preparar dados da transação:', error)
    }
  }

  const handleConfirmDelete = async () => {
    if (!onDelete || isDeleting) {
      return
    }

    const currentId = getValues('id')
    if (!currentId) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await onDelete(currentId)
      if (result) {
        setConfirmDeleteOpen(false)
      }
    } catch (error) {
      console.error('Erro ao excluir transação no formulário:', error)
    } finally {
      setIsDeleting(false)
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
            <form onSubmit={handleSubmit(onValidSubmit)} className="space-y-6">
              <input type="hidden" {...register('id')} />
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
                  placeholder="Ex: Compra no supermercado"
                  required
                  disabled={isSaving}
                  error={Boolean(errors.description)}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="mt-2 text-xs text-red-400">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoria
                </label>
                <LiquidInput
                  type="text"
                  placeholder="Ex: Alimentação"
                  disabled={isSaving}
                  {...register('category')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conta offline {hasManualAccounts ? '*' : ''}
                </label>
                <select
                  className={`w-full rounded-md border bg-slate-900/70 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 ${
                    errors.accountId
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-slate-700 focus:ring-blue-500'
                  }`}
                  required={manualAccountRequired}
                  disabled={
                    isSaving || (!hasManualAccounts && !allowNonManualSelection)
                  }
                  {...register('accountId')}
                >
                  <option value="">
                    {hasManualAccounts
                      ? 'Selecione a conta que receberá a transação'
                      : 'Nenhuma conta manual disponível'}
                  </option>
                  {!currentAccountIsManual && accountIdValue && (
                    <option value={accountIdValue} disabled>
                      Conta conectada (somente leitura)
                    </option>
                  )}
                  {manualAccounts.map((accountOption) => (
                    <option key={accountOption.id} value={accountOption.id}>
                      {accountOption.name}
                    </option>
                  ))}
                </select>
                {errors.accountId && (
                  <p className="mt-2 text-xs text-red-400">
                    {errors.accountId.message}
                  </p>
                )}
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
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    required
                    disabled={isSaving}
                    error={Boolean(errors.amount)}
                    {...register('amount')}
                  />
                  {errors.amount && (
                    <p className="mt-2 text-xs text-red-400">
                      {errors.amount.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Data *
                  </label>
                  <LiquidInput
                    type="date"
                    required
                    disabled={isSaving}
                    error={Boolean(errors.date)}
                    {...register('date')}
                  />
                  {errors.date && (
                    <p className="mt-2 text-xs text-red-400">
                      {errors.date.message}
                    </p>
                  )}
                </div>
              </div>

              <div
                className={`flex flex-col gap-3 pt-2 sm:flex-row sm:items-center ${
                  isEditing && onDelete ? 'sm:justify-between' : 'sm:justify-end'
                }`}
              >
                {isEditing && onDelete && (
                  <LiquidButton
                    type="button"
                    variant="outline"
                    className="text-sm border-red-500/40 text-red-300 hover:bg-red-500/10 sm:w-auto w-full"
                    onClick={() => setConfirmDeleteOpen(true)}
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? 'Excluindo...' : 'Excluir Transação'}
                  </LiquidButton>
                )}
                <div className="flex justify-end gap-3 sm:justify-end sm:w-auto w-full">
                  <LiquidButton
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSaving || isDeleting}
                  >
                    Cancelar
                  </LiquidButton>
                  <LiquidButton type="submit" disabled={isSaving || isDeleting}>
                    {isSaving
                      ? 'Salvando...'
                      : isEditing
                        ? 'Salvar Alterações'
                        : 'Adicionar Transação'}
                  </LiquidButton>
                </div>
              </div>
            </form>
          )}
        </LiquidCard>
      </motion.div>
      {isEditing && onDelete && (
        <ConfirmDeleteModal
          isOpen={confirmDeleteOpen}
          message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
          onCancel={() => {
            if (!isDeleting) {
              setConfirmDeleteOpen(false)
            }
          }}
          onConfirm={handleConfirmDelete}
          confirmLabel={isDeleting ? 'Excluindo...' : 'Excluir'}
        />
      )}
    </div>
  )
}
