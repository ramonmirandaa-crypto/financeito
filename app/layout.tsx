import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <head>
        <script src="https://connect.pluggy.ai/sdk.js" async></script>
      </head>
      <body className={`${inter.className} bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100`}>
        <nav className="sticky top-0 z-50 backdrop-blur bg-slate-900/40 border-b border-white/10">
          <div className="max-w-6xl mx-auto p-3 flex gap-6 text-sm">
            <a href="/">Início</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/login">Entrar</a>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto p-4">{children}</main>
      </body>
    </html>
  )
}
