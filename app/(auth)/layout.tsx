import '../globals.css'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import ThemeToggle from '@/components/theme-toggle'
import ThemeScript from '@/components/theme-script'
import { ThemeProvider } from '@/contexts/theme-context'
import { ToastRoot } from '@/components/toast-root'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} min-h-screen flex items-center justify-center`}>
        <ClerkProvider>
          <ThemeProvider>
            <ThemeToggle className="fixed top-6 right-6 z-50" />
            {children}
            <ToastRoot />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  )
}
