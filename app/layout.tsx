import './globals.css'
import Link from 'next/link'
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
          <main className="relative min-h-screen w-full">
            <FluidSidebar />
            <div className="flex min-h-screen flex-col">
              <header className="sticky top-0 z-30">
                <div className="px-4 pt-6 pb-4 pl-24 sm:px-6 sm:pl-28 lg:px-8 lg:pl-32">
                  <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
                    <Link
                      href="/"
                      className="text-lg font-semibold text-foreground transition-colors hover:text-primary"
                    >
                      Financeito
                    </Link>
                  </div>
                </div>
              </header>
              <div className="flex-1 px-4 pb-8 pl-24 sm:px-6 sm:pl-28 lg:px-8 lg:pl-32">
                <div className="mx-auto w-full max-w-6xl">
                  {children}
                </div>
              </div>
            </div>
          </main>
          <FloatingProfileMenu />
        </Providers>
      </body>
    </html>
  )
}
