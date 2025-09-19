import { CreditCard, Home, PiggyBank, Plug, Target, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface QuickAccessItem {
  title: string
  description: string
  href: string
}

export interface NavigationItem {
  href: string
  label: string
  icon?: LucideIcon
  showInSidebar?: boolean
  quickAccessItems?: QuickAccessItem[]
}

export const navigationItems: NavigationItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    quickAccessItems: [
      {
        title: 'Contas',
        description: 'Resumo das suas contas conectadas',
        href: '/dashboard#accounts',
      },
      {
        title: 'Transações',
        description: 'Histórico de movimentações',
        href: '/dashboard#transactions',
      },
      {
        title: 'Evolução de Saldos',
        description: 'Gráficos dos saldos ao longo do tempo',
        href: '/dashboard#balance-evolution',
      },
    ],
  },
  {
    href: '/budget',
    label: 'Orçamento',
    icon: PiggyBank,
    quickAccessItems: [
      {
        title: 'Orçamentos',
        description: 'Planeje seus gastos',
        href: '/budget',
      },
    ],
  },
  {
    href: '/goals',
    label: 'Metas',
    icon: Target,
    quickAccessItems: [
      {
        title: 'Metas',
        description: 'Acompanhe seus objetivos',
        href: '/goals',
      },
    ],
  },
  {
    href: '/subscriptions',
    label: 'Assinaturas',
    icon: CreditCard,
    quickAccessItems: [
      {
        title: 'Assinaturas',
        description: 'Controle suas assinaturas',
        href: '/subscriptions',
      },
    ],
  },
  {
    href: '/integrations',
    label: 'Integrações',
    icon: Plug,
    showInSidebar: false,
    quickAccessItems: [
      {
        title: 'Integrações',
        description: 'Gerencie conexões com bancos e serviços',
        href: '/integrations',
      },
    ],
  },
  {
    href: '/loans',
    label: 'Empréstimos',
    icon: TrendingUp,
    quickAccessItems: [
      {
        title: 'Empréstimos',
        description: 'Gerencie seus empréstimos',
        href: '/loans',
      },
    ],
  },
]
