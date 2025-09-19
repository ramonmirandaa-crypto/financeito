'use client'

import { QuickActions, type QuickAction } from '@/components/quick-actions'

interface DashboardQuickActionsProps {
  actions: QuickAction[]
}

export function DashboardQuickActions({ actions }: DashboardQuickActionsProps) {
  return <QuickActions actions={actions} />
}
