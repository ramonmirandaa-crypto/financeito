'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

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

  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-slate-900/40 border-b border-white/10">
      <div className="max-w-6xl mx-auto p-3 flex gap-6 text-sm">
        <Link href="/">Início</Link>
        <Link href="/dashboard">Dashboard</Link>
        {authenticated ? (
          <button onClick={handleLogout}>Sair</button>
        ) : (
          <Link href="/login">Entrar</Link>
        )}
      </div>
    </nav>
  )
}

