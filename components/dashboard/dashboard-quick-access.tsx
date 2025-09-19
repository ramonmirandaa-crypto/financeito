'use client'

import { QuickAccess, type QuickAccessItem } from '@/components/quick-access'

interface DashboardQuickAccessProps {
  items: QuickAccessItem[]
}

export function DashboardQuickAccess({ items }: DashboardQuickAccessProps) {
  return <QuickAccess items={items} />
}
