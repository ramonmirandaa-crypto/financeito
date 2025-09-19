'use client'

import Link from 'next/link'
import { LiquidCard } from '@/components/ui/liquid-card'
import type { QuickAccessItem } from '@/config/navigation'

interface QuickAccessProps {
  items: QuickAccessItem[]
}

export function QuickAccess({ items }: QuickAccessProps) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="block">
          <LiquidCard variant="hoverable" className="h-full">
            <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </LiquidCard>
        </Link>
      ))}
    </div>
  )
}

export default QuickAccess

export type { QuickAccessItem }
