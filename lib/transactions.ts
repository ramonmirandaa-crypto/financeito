import { formatDateToISODate } from '@/lib/format-utils'
import type { TransactionFormData } from '@/components/forms/transaction-form'

export interface NormalizedTransaction {
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

export interface TransactionsPageMeta {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedTransactionsResponse {
  data: NormalizedTransaction[]
  meta?: Partial<TransactionsPageMeta>
}

export const parseDateValue = (value: unknown): string => {
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

export const normalizeTransaction = (transaction: any): NormalizedTransaction => ({
  ...transaction,
  id: transaction.id,
  description: transaction.description ?? '',
  category: transaction.category ?? '',
  amount: Number(transaction.amount ?? 0),
  date: parseDateValue(transaction.date),
})

export const toTransactionFormData = (
  transaction: NormalizedTransaction,
): TransactionFormData => ({
  id: transaction.id,
  description: transaction.description ?? '',
  category: transaction.category ?? '',
  amount: transaction.amount,
  date: formatDateToISODate(transaction.date),
  accountId: transaction.accountId ?? null,
})
