export const THEME_STORAGE_KEY = 'financeito.theme' as const

export type Theme = 'light' | 'dark'

export const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark'
