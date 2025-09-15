'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/ui/toast'

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <ToastProvider>
        {children}
        <ToastContainer />
      </ToastProvider>
    </ClerkProvider>
  )
}
