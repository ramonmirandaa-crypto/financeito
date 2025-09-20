import { describe, expect, it } from 'vitest'

const routes = [
  { modulePath: '@/app/(app)/profile/page', title: 'Meu Perfil | Financeito' },
  { modulePath: '@/app/(app)/settings/page', title: 'Configurações | Financeito' },
  { modulePath: '@/app/(app)/security/page', title: 'Segurança | Financeito' },
  { modulePath: '@/app/(app)/billing/page', title: 'Planos e Cobrança | Financeito' },
  { modulePath: '@/app/(app)/notifications/page', title: 'Notificações | Financeito' },
  { modulePath: '@/app/(app)/help/page', title: 'Ajuda e Suporte | Financeito' },
] as const

describe('user dropdown routes', () => {
  it.each(routes)('exports a valid page component for %s', async ({ modulePath, title }) => {
    const pageModule = await import(modulePath)

    expect(pageModule).toBeDefined()
    expect(pageModule.default).toBeTypeOf('function')
    expect(pageModule.metadata?.title).toBe(title)
  })
})
