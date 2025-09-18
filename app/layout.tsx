import './globals.css'
import { Inter } from 'next/font/google'
import FluidSidebar from '@/components/fluid-sidebar'
import FloatingProfileMenu from '@/components/floating-profile-menu'
import ThemeScript from '@/components/theme-script'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <script src="https://connect.pluggy.ai/sdk.js" async></script>
      </head>
      <body className={inter.className}>
        <Providers>
          <main className="min-h-screen w-full relative">
            <FluidSidebar />
            <div className="flex flex-col">
              <div className="flex-1 p-4 max-w-6xl w-full mx-auto">
                {children}
              </div>
            </div>
          </main>
          <FloatingProfileMenu />
        </Providers>
      </body>
    </html>
  )
}
