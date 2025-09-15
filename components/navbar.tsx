'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LiquidButton } from './ui/liquid-button'
import { useUser, useAuth, SignedIn, SignedOut } from '@clerk/nextjs'
import UserProfileDropdown from './auth/user-profile-dropdown'

export default function Navbar() {
  const { user: _user } = useUser()
  const { signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/budget', label: 'Orçamento' },
    { href: '/goals', label: 'Metas' },
    { href: '/subscriptions', label: 'Assinaturas' },
    { href: '/loans', label: 'Empréstimos' },
  ]

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
          <SignedIn>
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    pathname === item.href ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {item.label}
                  {pathname === item.href && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary-glow rounded-full"
                      layoutId="navbar-indicator"
                    />
                  )}
                </Link>
              ))}
            </div>
          </SignedIn>

          {/* Auth Actions */}
          <div className="flex items-center space-x-3">
            <SignedIn>
              <UserProfileDropdown />
            </SignedIn>
            <SignedOut>
              <LiquidButton
                variant="primary"
                size="sm"
                onClick={() => router.push('/login')}
              >
                Entrar
              </LiquidButton>
            </SignedOut>
          </div>
        </div>

        {/* Mobile Navigation */}
        <SignedIn>
          <div className="md:hidden mt-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    pathname === item.href
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card-glass/30'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </SignedIn>
      </div>
    </motion.nav>
  )
}
