import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from '@/components/navbar'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <head>
        <script src="https://connect.pluggy.ai/sdk.js" async></script>
      </head>
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="max-w-6xl mx-auto p-4">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
