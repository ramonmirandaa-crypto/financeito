'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/budget', label: 'Orçamento' },
    { href: '/goals', label: 'Metas' },
    { href: '/subscriptions', label: 'Assinaturas' },
    { href: '/loans', label: 'Empréstimos' },
  ]

  return (
    <aside className="sticky top-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border p-4">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === item.href
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
