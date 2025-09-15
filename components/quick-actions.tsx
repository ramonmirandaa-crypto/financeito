'use client'

import Link from 'next/link'
import { LiquidButton } from '@/components/ui/liquid-button'

export interface QuickAction {
  title: string
  href?: string
  onClick?: () => void
}

interface QuickActionsProps {
  actions: QuickAction[]
}

export function QuickActions({ actions }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        action.href ? (
          <Link key={action.title} href={action.href}>
            <LiquidButton size="sm" variant="primary">
              {action.title}
            </LiquidButton>
          </Link>
        ) : (
          <LiquidButton
            key={action.title}
            size="sm"
            variant="primary"
            onClick={action.onClick}
          >
            {action.title}
          </LiquidButton>
        )
      ))}
    </div>
  )
}

export default QuickActions
