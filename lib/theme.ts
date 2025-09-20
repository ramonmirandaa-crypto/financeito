export const chartColors = [
  'hsl(var(--color-dashboard))',
  'hsl(var(--color-accounts))',
  'hsl(var(--color-transactions))',
  'hsl(var(--color-investments))',
  'hsl(var(--color-goals))',
  'hsl(var(--destructive))',
]

export const THEME_STORAGE_KEY = 'financeito.theme' as const

export type Theme = 'light' | 'dark'

export const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark'
