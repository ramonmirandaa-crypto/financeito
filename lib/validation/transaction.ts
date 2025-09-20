import { z } from 'zod'

import { formatDateToISODate } from '@/lib/format-utils'

const dateStringSchema = z
  .string({ required_error: 'Data é obrigatória' })
  .trim()
  .min(1, 'Data é obrigatória')
  .refine((value) => {
    const parsed = new Date(value)
    return !Number.isNaN(parsed.getTime())
  }, 'Data inválida')

const optionalTrimmedStringSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (typeof value !== 'string') {
      return null
    }

    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  })

const amountNumberSchema = z
  .preprocess((value) => {
    if (value === null || value === undefined) {
      return undefined
    }

    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim()
      if (!normalized) {
        return undefined
      }

      const parsed = Number(normalized)
      return Number.isFinite(parsed) ? parsed : NaN
    }

    if (typeof value === 'number') {
      return value
    }

    return value
  }, z.number({
    required_error: 'Valor é obrigatório',
    invalid_type_error: 'Valor inválido',
  }).refine((value) => Number.isFinite(value), {
    message: 'Valor inválido',
  }))

const baseTransactionSchema = z.object({
  description: z
    .string({ required_error: 'Descrição é obrigatória' })
    .trim()
    .min(1, 'Descrição é obrigatória'),
  category: optionalTrimmedStringSchema,
  amount: amountNumberSchema,
  date: dateStringSchema,
  accountId: optionalTrimmedStringSchema,
})

export const transactionCreateSchema = baseTransactionSchema
export const transactionUpdateSchema = baseTransactionSchema

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>

export const transactionFormSchema = z.object({
  id: z.string().optional(),
  description: baseTransactionSchema.shape.description,
  category: z.string().optional(),
  amount: z
    .string({ required_error: 'Valor é obrigatório' })
    .trim()
    .min(1, 'Valor é obrigatório')
    .refine((value) => {
      const normalized = value.replace(',', '.').trim()
      if (!normalized) {
        return false
      }

      const parsed = Number(normalized)
      return Number.isFinite(parsed)
    }, 'Informe um valor numérico válido'),
  date: dateStringSchema,
  accountId: z.string().optional(),
})

export type TransactionFormValues = z.infer<typeof transactionFormSchema>

export type TransactionFormData = TransactionCreateInput & { id?: string }

export const createTransactionFormValues = (
  transaction?: TransactionFormData | null,
  fallbackAccountId: string = '',
): TransactionFormValues => ({
  id: transaction?.id,
  description: transaction?.description ?? '',
  category: transaction?.category ?? '',
  amount:
    transaction?.amount !== undefined && transaction?.amount !== null
      ? String(transaction.amount)
      : '',
  date: formatDateToISODate(transaction?.date ?? undefined),
  accountId: transaction?.accountId ?? fallbackAccountId,
})

export const parseTransactionFormValues = (
  values: TransactionFormValues,
): TransactionFormData => {
  const { id, ...payload } = values
  const parsed = transactionCreateSchema.parse(payload)

  if (typeof id === 'string' && id.trim().length > 0) {
    return { ...parsed, id: id.trim() }
  }

  return parsed
}
