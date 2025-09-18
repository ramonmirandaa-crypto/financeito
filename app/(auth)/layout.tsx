import '../globals.css'
import { Inter } from 'next/font/google'
import ThemeToggle from '@/components/theme-toggle'
import ThemeScript from '@/components/theme-script'
import Providers from '../providers'

const inter = Inter({ subsets: ['latin'] })

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={`${inter.className} min-h-screen flex items-center justify-center`}>
        <Providers>
          <ThemeToggle className="fixed top-6 right-6 z-50" />
          {children}
        </Providers>
      </body>
    </html>
  )
}
