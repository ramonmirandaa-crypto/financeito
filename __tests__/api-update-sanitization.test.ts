import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const ensureUserMock = vi.fn()

const goalFindFirstMock = vi.fn()
const goalUpdateMock = vi.fn()

const loanFindFirstMock = vi.fn()
const loanUpdateMock = vi.fn()

const subscriptionFindFirstMock = vi.fn()
const subscriptionUpdateMock = vi.fn()

const serializeBudgetMock = vi.fn()
const serializeGoalMock = vi.fn()
const serializeLoanMock = vi.fn()
const serializeSubscriptionMock = vi.fn()

let goalUpdatePayload: any
let loanUpdatePayload: any
let subscriptionUpdatePayload: any

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock
}))

vi.mock('@/lib/ensure-user', () => ({
  ensureUser: ensureUserMock
}))

vi.mock('@/lib/prisma-serializers', () => ({
  serializeBudget: serializeBudgetMock,
  serializeGoal: serializeGoalMock,
  serializeLoan: serializeLoanMock,
  serializeSubscription: serializeSubscriptionMock
}))

vi.mock('@/lib/db', () => {
  const prisma = {
    goal: {
      findFirst: goalFindFirstMock,
      update: goalUpdateMock
    },
    loan: {
      findFirst: loanFindFirstMock,
      update: loanUpdateMock
    },
    subscription: {
      findFirst: subscriptionFindFirstMock,
      update: subscriptionUpdateMock
    }
  }

  return {
    prisma,
    default: prisma
  }
})

beforeEach(() => {
  authMock.mockReset()
  ensureUserMock.mockReset()
  goalFindFirstMock.mockReset()
  goalUpdateMock.mockReset()
  loanFindFirstMock.mockReset()
  loanUpdateMock.mockReset()
  subscriptionFindFirstMock.mockReset()
  subscriptionUpdateMock.mockReset()
  serializeBudgetMock.mockReset()
  serializeGoalMock.mockReset()
  serializeLoanMock.mockReset()
  serializeSubscriptionMock.mockReset()

  goalUpdatePayload = undefined
  loanUpdatePayload = undefined
  subscriptionUpdatePayload = undefined

  authMock.mockReturnValue({ userId: 'user_123' })
  ensureUserMock.mockResolvedValue(undefined)

  goalFindFirstMock.mockResolvedValue({
    id: 'goal_1',
    userId: 'user_123',
    title: 'Existing Goal',
    description: 'Existing description',
    targetAmount: 500,
    currentAmount: 200,
    currency: 'BRL',
    targetDate: new Date('2025-01-01T00:00:00.000Z'),
    category: 'general',
    priority: 'medium',
    isCompleted: false
  })

  goalUpdateMock.mockImplementation(async ({ data }: any) => {
    goalUpdatePayload = data
    return {
      id: 'goal_1',
      userId: 'user_123',
      title: data.title ?? 'Existing Goal',
      description: data.description ?? 'Existing description',
      targetAmount: data.targetAmount ?? 500,
      currentAmount: data.currentAmount ?? 200,
      currency: data.currency ?? 'BRL',
      targetDate: data.targetDate ?? new Date('2025-01-01T00:00:00.000Z'),
      category: data.category ?? 'general',
      priority: data.priority ?? 'medium',
      isCompleted: data.isCompleted ?? false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  loanFindFirstMock.mockResolvedValue({
    id: 'loan_1',
    userId: 'user_123',
    isPaid: false,
    paidAt: null
  })

  loanUpdateMock.mockImplementation(async ({ data }: any) => {
    loanUpdatePayload = data
    return {
      id: 'loan_1',
      userId: 'user_123',
      title: data.title ?? 'Existing Loan',
      description: data.description ?? null,
      amount: data.amount ?? 1000,
      currency: data.currency ?? 'BRL',
      lenderName: data.lenderName ?? 'Existing Lender',
      lenderContact: data.lenderContact ?? null,
      type: data.type ?? 'personal',
      interestRate: data.interestRate ?? null,
      installmentCount: data.installmentCount ?? null,
      dueDate: data.dueDate ?? new Date('2025-01-01T00:00:00.000Z'),
      isPaid: data.isPaid ?? false,
      paidAt: Object.prototype.hasOwnProperty.call(data, 'paidAt') ? data.paidAt : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  subscriptionFindFirstMock.mockResolvedValue({
    id: 'subscription_1',
    userId: 'user_123'
  })

  subscriptionUpdateMock.mockImplementation(async ({ data }: any) => {
    subscriptionUpdatePayload = data
    return {
      id: 'subscription_1',
      userId: 'user_123',
      name: data.name ?? 'Existing Subscription',
      description: data.description ?? null,
      amount: data.amount ?? 49.9,
      currency: data.currency ?? 'BRL',
      billingCycle: data.billingCycle ?? 'monthly',
      nextBilling: data.nextBilling ?? new Date('2025-01-01T00:00:00.000Z'),
      category: data.category ?? null,
      autoRenew: data.autoRenew ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  serializeBudgetMock.mockImplementation((budget: any) => budget)

  serializeGoalMock.mockImplementation((goal: any) => ({
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    targetDate: goal.targetDate instanceof Date ? goal.targetDate.toISOString() : goal.targetDate,
    createdAt: goal.createdAt instanceof Date ? goal.createdAt.toISOString() : goal.createdAt,
    updatedAt: goal.updatedAt instanceof Date ? goal.updatedAt.toISOString() : goal.updatedAt,
    serialization: 'goal'
  }))

  serializeLoanMock.mockImplementation((loan: any) => ({
    ...loan,
    amount: typeof loan.amount === 'number' ? loan.amount : Number(loan.amount),
    interestRate:
      loan.interestRate === null || loan.interestRate === undefined
        ? loan.interestRate
        : typeof loan.interestRate === 'number'
          ? loan.interestRate
          : Number(loan.interestRate),
    dueDate: loan.dueDate instanceof Date ? loan.dueDate.toISOString() : loan.dueDate,
    paidAt: loan.paidAt instanceof Date ? loan.paidAt.toISOString() : loan.paidAt,
    createdAt: loan.createdAt instanceof Date ? loan.createdAt.toISOString() : loan.createdAt,
    updatedAt: loan.updatedAt instanceof Date ? loan.updatedAt.toISOString() : loan.updatedAt,
    serialization: 'loan'
  }))

  serializeSubscriptionMock.mockImplementation((subscription: any) => ({
    ...subscription,
    amount:
      typeof subscription.amount === 'number' ? subscription.amount : Number(subscription.amount),
    nextBilling:
      subscription.nextBilling instanceof Date
        ? subscription.nextBilling.toISOString()
        : subscription.nextBilling,
    createdAt:
      subscription.createdAt instanceof Date
        ? subscription.createdAt.toISOString()
        : subscription.createdAt,
    updatedAt:
      subscription.updatedAt instanceof Date
        ? subscription.updatedAt.toISOString()
        : subscription.updatedAt,
    serialization: 'subscription'
  }))
})

describe('Goal update sanitization', () => {
  it('prevents overriding restricted fields while updating goal', async () => {
    const { PATCH } = await import('@/app/api/goals/[id]/route')

    const response = await PATCH(
      new Request('http://localhost/api/goals/goal_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Goal',
          description: 'Updated description',
          targetAmount: '750.5',
          currentAmount: '320.75',
          currency: 'USD',
          targetDate: '2026-06-01T00:00:00.000Z',
          category: 'travel',
          priority: 'high',
          isCompleted: true,
          userId: 'attacker',
          createdAt: '1999-01-01T00:00:00.000Z'
        })
      }) as any,
      { params: { id: 'goal_1' } }
    )

    expect(response.status).toBe(200)
    expect(goalUpdateMock).toHaveBeenCalledTimes(1)
    expect(goalUpdatePayload).toMatchObject({
      title: 'Updated Goal',
      description: 'Updated description',
      targetAmount: 750.5,
      currentAmount: 320.75,
      currency: 'USD',
      category: 'travel',
      priority: 'high',
      isCompleted: true
    })
    expect(goalUpdatePayload.targetDate).toBeInstanceOf(Date)
    expect(goalUpdatePayload).not.toHaveProperty('userId')
    expect(goalUpdatePayload).not.toHaveProperty('createdAt')

    expect(serializeGoalMock).toHaveBeenCalledTimes(1)
    expect(serializeGoalMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'goal_1',
        targetAmount: 750.5,
        currentAmount: 320.75,
        targetDate: expect.any(Date)
      })
    )

    const body = await response.json()
    expect(body.targetAmount).toBe(750.5)
    expect(body.currentAmount).toBe(320.75)
    expect(body.serialization).toBe('goal')
    expect(body.targetDate).toBe('2026-06-01T00:00:00.000Z')
    expect(typeof body.createdAt).toBe('string')
    expect(typeof body.updatedAt).toBe('string')
  })
})

describe('Loan update sanitization', () => {
  it('ignores restricted loan fields and computes paidAt internally', async () => {
    const { PATCH } = await import('@/app/api/loans/[id]/route')

    const response = await PATCH(
      new Request('http://localhost/api/loans/loan_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Updated Loan',
          description: 'Paid ahead of time',
          amount: '1500.25',
          currency: 'USD',
          lenderName: 'Updated Bank',
          lenderContact: 'bank@example.com',
          type: 'auto',
          interestRate: '3.75',
          installmentCount: '12',
          dueDate: '2026-02-01T00:00:00.000Z',
          isPaid: true,
          paidAt: '2000-01-01T00:00:00.000Z',
          userId: 'malicious-user'
        })
      }) as any,
      { params: { id: 'loan_1' } }
    )

    expect(response.status).toBe(200)
    expect(loanUpdateMock).toHaveBeenCalledTimes(1)
    expect(loanUpdatePayload).toMatchObject({
      title: 'Updated Loan',
      description: 'Paid ahead of time',
      amount: 1500.25,
      currency: 'USD',
      lenderName: 'Updated Bank',
      lenderContact: 'bank@example.com',
      type: 'auto',
      interestRate: 3.75,
      installmentCount: 12,
      isPaid: true
    })
    expect(loanUpdatePayload.dueDate).toBeInstanceOf(Date)
    expect(loanUpdatePayload.paidAt).toBeInstanceOf(Date)
    expect(loanUpdatePayload).not.toHaveProperty('userId')
    expect(loanUpdatePayload).not.toHaveProperty('paidAt', '2000-01-01T00:00:00.000Z')

    expect(serializeLoanMock).toHaveBeenCalledTimes(1)
    expect(serializeLoanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'loan_1',
        amount: 1500.25,
        interestRate: 3.75,
        paidAt: expect.any(Date)
      })
    )

    const body = await response.json()
    expect(body.amount).toBe(1500.25)
    expect(body.interestRate).toBe(3.75)
    expect(body.serialization).toBe('loan')
    expect(typeof body.dueDate).toBe('string')
    expect(typeof body.paidAt).toBe('string')
  })
})

describe('Subscription update sanitization', () => {
  it('only passes allowed subscription fields to prisma', async () => {
    const { PATCH } = await import('@/app/api/subscriptions/[id]/route')

    const response = await PATCH(
      new Request('http://localhost/api/subscriptions/subscription_1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Plan',
          description: 'Now includes HD streaming',
          amount: '29.99',
          currency: 'USD',
          billingCycle: 'yearly',
          nextBilling: '2026-07-15T00:00:00.000Z',
          category: 'entertainment',
          autoRenew: false,
          userId: 'attacker',
          createdAt: '2001-09-09T00:00:00.000Z'
        })
      }) as any,
      { params: { id: 'subscription_1' } }
    )

    expect(response.status).toBe(200)
    expect(subscriptionUpdateMock).toHaveBeenCalledTimes(1)
    expect(subscriptionUpdatePayload).toMatchObject({
      name: 'Updated Plan',
      description: 'Now includes HD streaming',
      amount: 29.99,
      currency: 'USD',
      billingCycle: 'yearly',
      category: 'entertainment',
      autoRenew: false
    })
    expect(subscriptionUpdatePayload.nextBilling).toBeInstanceOf(Date)
    expect(subscriptionUpdatePayload).not.toHaveProperty('userId')
    expect(subscriptionUpdatePayload).not.toHaveProperty('createdAt')

    expect(serializeSubscriptionMock).toHaveBeenCalledTimes(1)
    expect(serializeSubscriptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'subscription_1',
        amount: 29.99,
        nextBilling: expect.any(Date)
      })
    )

    const body = await response.json()
    expect(body.amount).toBe(29.99)
    expect(body.serialization).toBe('subscription')
    expect(body.nextBilling).toBe('2026-07-15T00:00:00.000Z')
    expect(typeof body.createdAt).toBe('string')
    expect(typeof body.updatedAt).toBe('string')
  })
})
