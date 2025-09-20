import './globals.css'
import { Inter } from 'next/font/google'
import ThemeScript from '@/components/theme-script'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script src="https://connect.pluggy.ai/sdk.js" async></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
