export interface BudgetItem {
  id?: string
  budgetId?: string
  accountId?: string | null
  name?: string
  category: string
  amount: number
  spent?: number
  currency?: string
  createdAt?: string
  updatedAt?: string
}

export interface Budget {
  id?: string
  userId?: string
  name: string
  totalAmount: number
  currency?: string
  period?: string
  startDate?: string
  endDate?: string
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  items: BudgetItem[]
}
