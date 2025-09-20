import Link from 'next/link'
import type { ReactNode } from 'react'
import FluidSidebar from '@/components/fluid-sidebar'
import FloatingProfileMenu from '@/components/floating-profile-menu'
import Providers from '../providers'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
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
  )
}
