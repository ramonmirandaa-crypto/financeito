'use client'

import { useTheme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'
import { Moon, Sun } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      aria-pressed={isDark}
      className={cn(
        'group relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 text-slate-900 shadow-[0_8px_32px_rgba(15,23,42,0.15)] backdrop-blur-xl transition-all duration-300 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:bg-slate-900/70 dark:shadow-[0_8px_32px_rgba(15,23,42,0.35)]',
        className
      )}
    >
      <span className="sr-only">Alternar entre tema claro e escuro</span>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-emerald-400/20 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-75"
      />
      <div className="relative flex h-full w-full items-center justify-center">
        <Sun
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            'h-5 w-5 transition-all duration-300',
            isDark
              ? 'rotate-90 scale-0 opacity-0'
              : 'rotate-0 scale-100 opacity-100 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.45)]'
          )}
        />
        <Moon
          aria-hidden
          strokeWidth={1.5}
          className={cn(
            'absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 left-1/2 top-1/2',
            isDark
              ? 'rotate-0 scale-100 opacity-100 text-sky-300 drop-shadow-[0_0_12px_rgba(125,211,252,0.45)]'
              : '-rotate-90 scale-0 opacity-0'
          )}
        />
      </div>
    </button>
  )
}
