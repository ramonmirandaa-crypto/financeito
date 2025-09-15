'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  return <ClerkProvider>{children}</ClerkProvider>
}
