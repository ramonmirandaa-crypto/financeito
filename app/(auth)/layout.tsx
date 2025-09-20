import '../globals.css'
import { Inter } from 'next/font/google'
import ThemeToggle from '@/components/theme-toggle'
import ThemeScript from '@/components/theme-script'
import { ThemeProvider } from '@/contexts/theme-context'
import { ToastProvider } from '@/contexts/toast-context'
import { ToastContainer } from '@/components/ui/toast'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} min-h-screen flex items-center justify-center`}>
        <ThemeProvider>
          <ToastProvider>
            <ThemeToggle className="fixed top-6 right-6 z-50" />
            {children}
            <ToastContainer />
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
