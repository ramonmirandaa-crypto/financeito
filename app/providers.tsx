'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { ThemeProvider } from '@/contexts/theme-context'
import { ToastRoot } from '@/components/toast-root'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ThemeProvider>
        {children}
        <ToastRoot />
      </ThemeProvider>
    </ClerkProvider>
  )
}
