import { describe, expect, it } from 'vitest'

import { buildUpcomingPayments } from '@/hooks/use-dashboard-data'

const futureDate = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

describe('buildUpcomingPayments', () => {
  it('uses the loan title when no description is provided', () => {
    const payments = buildUpcomingPayments([], [
      {
        title: 'Car Loan',
        description: undefined,
        amount: 500,
        dueDate: futureDate(2),
        isPaid: false,
      },
    ])

    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({
      type: 'Empréstimo',
      name: 'Car Loan',
    })
  })

  it('falls back to the loan description when the title is not available', () => {
    const payments = buildUpcomingPayments([], [
      {
        title: '   ',
        description: 'Emergency funds loan',
        amount: 300,
        dueDate: futureDate(3),
        isPaid: false,
      },
    ])

    expect(payments).toHaveLength(1)
    expect(payments[0]).toMatchObject({
      type: 'Empréstimo',
      name: 'Emergency funds loan',
    })
  })
})
