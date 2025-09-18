'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'

import { THEME_STORAGE_KEY, isTheme, type Theme } from '@/lib/theme'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getInitialTheme = (): { theme: Theme; hasUserPreference: boolean } => {
  if (typeof window === 'undefined') {
    return { theme: 'light', hasUserPreference: false }
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (isTheme(storedTheme)) {
    return { theme: storedTheme, hasUserPreference: true }
  }

  return { theme: getSystemTheme(), hasUserPreference: false }
}

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  const oppositeTheme: Theme = theme === 'dark' ? 'light' : 'dark'

  root.classList.remove(oppositeTheme)
  root.classList.add(theme)
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light')
  const [isThemeResolved, setIsThemeResolved] = useState(false)
  const [hasUserPreference, setHasUserPreference] = useState(false)

  useEffect(() => {
    const { theme: initialTheme, hasUserPreference } = getInitialTheme()

    setThemeState(initialTheme)
    setHasUserPreference(hasUserPreference)
    applyThemeToDocument(initialTheme)
    setIsThemeResolved(true)
  }, [])

  useEffect(() => {
    if (!isThemeResolved) {
      return
    }

    applyThemeToDocument(theme)

    if (typeof window === 'undefined') {
      return
    }

    if (hasUserPreference) {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    } else {
      window.localStorage.removeItem(THEME_STORAGE_KEY)
    }
  }, [theme, isThemeResolved, hasUserPreference])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return
      }

      if (isTheme(event.newValue)) {
        setHasUserPreference(true)
        setThemeState(event.newValue)
      }

      if (event.newValue === null) {
        const systemTheme = getSystemTheme()
        setHasUserPreference(false)
        setThemeState(systemTheme)
      }
    }

    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemPreferenceChange = (event: MediaQueryListEvent) => {
      if (!hasUserPreference) {
        setThemeState(event.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleSystemPreferenceChange)

    return () => {
      mediaQuery.removeEventListener('change', handleSystemPreferenceChange)
    }
  }, [hasUserPreference])

  const setTheme = useCallback((value: Theme) => {
    setHasUserPreference(true)
    setThemeState(value)
  }, [])

  const toggleTheme = useCallback(() => {
    setHasUserPreference(true)
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme
    }),
    [theme, toggleTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
}
