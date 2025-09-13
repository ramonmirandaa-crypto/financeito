'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LiquidButton } from './ui/liquid-button'

export default function Navbar() {
  const [authenticated, setAuthenticated] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function checkAuth() {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setAuthenticated(data.authenticated)
      } else {
        setAuthenticated(false)
      }
    } catch {
      setAuthenticated(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [pathname])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    setAuthenticated(false)
    router.refresh()
  }

  const navItems = authenticated ? [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/budget', label: 'Orçamento' },
    { href: '/goals', label: 'Metas' },
    { href: '/subscriptions', label: 'Assinaturas' },
    { href: '/loans', label: 'Empréstimos' }
  ] : []

  return (
    <motion.nav 
      className="sticky top-0 z-50 glass-effect border-b border-white/10"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <motion.div 
              className="text-2xl font-bold gradient-text"
              whileHover={{ scale: 1.05 }}
            >
              💰 Financeito
            </motion.div>
          </Link>

          {/* Navigation Items */}
          {authenticated && (
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-blue-300 ${
                    pathname === item.href ? 'text-blue-400' : 'text-slate-300'
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                      layoutId="navbar-indicator"
                    />
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Auth Actions */}
          <div className="flex items-center space-x-3">
            {authenticated ? (
              <LiquidButton 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
              >
                Sair
              </LiquidButton>
            ) : (
              <LiquidButton 
                variant="primary" 
                size="sm" 
                onClick={() => router.push('/login')}
              >
                Entrar
              </LiquidButton>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {authenticated && (
          <div className="md:hidden mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    pathname === item.href 
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}

