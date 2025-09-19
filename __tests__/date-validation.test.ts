import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const ensureUserMock = vi.fn()

const subscriptionCreateMock = vi.fn()
const subscriptionFindFirstMock = vi.fn()
const subscriptionUpdateMock = vi.fn()

const goalCreateMock = vi.fn()
const goalFindFirstMock = vi.fn()
const goalUpdateMock = vi.fn()

const serializeSubscriptionMock = vi.fn()
const serializeGoalMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock
}))

vi.mock('@/lib/ensure-user', () => ({
  ensureUser: ensureUserMock
}))

vi.mock('@/lib/prisma-serializers', () => ({
  serializeSubscription: serializeSubscriptionMock,
  serializeGoal: serializeGoalMock
}))

vi.mock('@/lib/db', () => {
  const prisma = {
    subscription: {
      create: subscriptionCreateMock,
      findFirst: subscriptionFindFirstMock,
      update: subscriptionUpdateMock
    },
    goal: {
      create: goalCreateMock,
      findFirst: goalFindFirstMock,
      update: goalUpdateMock
    }
  }

  return {
    prisma,
    default: prisma
  }
})

beforeEach(() => {
  vi.clearAllMocks()

  authMock.mockReturnValue({ userId: 'user_123' })
  ensureUserMock.mockResolvedValue(undefined)

  serializeSubscriptionMock.mockImplementation((subscription: any) => subscription)
  serializeGoalMock.mockImplementation((goal: any) => goal)

  subscriptionCreateMock.mockImplementation(async ({ data }: any) => ({
    id: 'subscription_1',
    userId: 'user_123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...data
  }))

  subscriptionFindFirstMock.mockResolvedValue({
    id: 'subscription_1',
    userId: 'user_123'
  })

  subscriptionUpdateMock.mockImplementation(async ({ data }: any) => ({
    id: 'subscription_1',
    userId: 'user_123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...data
  }))

  goalCreateMock.mockImplementation(async ({ data }: any) => ({
    id: 'goal_1',
    userId: 'user_123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...data
  }))

  goalFindFirstMock.mockResolvedValue({
    id: 'goal_1',
    userId: 'user_123'
  })

  goalUpdateMock.mockImplementation(async ({ data }: any) => ({
    id: 'goal_1',
    userId: 'user_123',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
    ...data
  }))
})

const jsonHeaders = { 'Content-Type': 'application/json' }

describe('Subscriptions nextBilling validation', () => {
  describe('POST /api/subscriptions', () => {
    it('rejects invalid nextBilling values', async () => {
      const { POST } = await import('@/app/api/subscriptions/route')

      const response = await POST(
        new Request('http://localhost/api/subscriptions', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            name: 'Streaming Plan',
            amount: '49.90',
            billingCycle: 'monthly',
            nextBilling: '2024-13-01',
            autoRenew: true
          })
        }) as any
      )

      expect(response.status).toBe(400)
      expect(subscriptionCreateMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ error: 'Campo nextBilling inválido' })
    })

    it('accepts valid nextBilling values', async () => {
      const { POST } = await import('@/app/api/subscriptions/route')

      const response = await POST(
        new Request('http://localhost/api/subscriptions', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            name: 'Streaming Plan',
            amount: '49.90',
            billingCycle: 'monthly',
            nextBilling: '2024-05-01T00:00:00.000Z',
            autoRenew: true
          })
        }) as any
      )

      expect(response.status).toBe(201)
      expect(subscriptionCreateMock).toHaveBeenCalledTimes(1)
      const payload = subscriptionCreateMock.mock.calls[0][0].data
      expect(payload.nextBilling).toBeInstanceOf(Date)
      expect((payload.nextBilling as Date).toISOString()).toBe('2024-05-01T00:00:00.000Z')
    })

    it('treats empty nextBilling as missing field', async () => {
      const { POST } = await import('@/app/api/subscriptions/route')

      const response = await POST(
        new Request('http://localhost/api/subscriptions', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            name: 'Streaming Plan',
            amount: '49.90',
            billingCycle: 'monthly',
            nextBilling: '',
            autoRenew: true
          })
        }) as any
      )

      expect(response.status).toBe(400)
      expect(subscriptionCreateMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ error: 'Campos obrigatórios não preenchidos' })
    })
  })

  describe('PATCH /api/subscriptions/[id]', () => {
    it('rejects invalid nextBilling values', async () => {
      const { PATCH } = await import('@/app/api/subscriptions/[id]/route')

      const response = await PATCH(
        new Request('http://localhost/api/subscriptions/subscription_1', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({
            nextBilling: 'not-a-real-date'
          })
        }) as any,
        { params: { id: 'subscription_1' } }
      )

      expect(response.status).toBe(400)
      expect(subscriptionUpdateMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ error: 'Campo nextBilling inválido' })
    })

    it('converts valid nextBilling values to Date instances', async () => {
      const { PATCH } = await import('@/app/api/subscriptions/[id]/route')

      const response = await PATCH(
        new Request('http://localhost/api/subscriptions/subscription_1', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({
            nextBilling: '2024-05-01T00:00:00.000Z'
          })
        }) as any,
        { params: { id: 'subscription_1' } }
      )

      expect(response.status).toBe(200)
      expect(subscriptionUpdateMock).toHaveBeenCalledTimes(1)
      const payload = subscriptionUpdateMock.mock.calls[0][0].data
      expect(payload.nextBilling).toBeInstanceOf(Date)
      expect((payload.nextBilling as Date).toISOString()).toBe('2024-05-01T00:00:00.000Z')
    })

    it('treats empty strings as null for nextBilling', async () => {
      const { PATCH } = await import('@/app/api/subscriptions/[id]/route')

      const response = await PATCH(
        new Request('http://localhost/api/subscriptions/subscription_1', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({
            nextBilling: ''
          })
        }) as any,
        { params: { id: 'subscription_1' } }
      )

      expect(response.status).toBe(200)
      expect(subscriptionUpdateMock).toHaveBeenCalledTimes(1)
      const payload = subscriptionUpdateMock.mock.calls[0][0].data
      expect(payload.nextBilling).toBeNull()
    })
  })
})

describe('Goals targetDate validation', () => {
  describe('POST /api/goals', () => {
    it('rejects invalid targetDate values', async () => {
      const { POST } = await import('@/app/api/goals/route')

      const response = await POST(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            title: 'Travel Fund',
            targetAmount: '5000',
            targetDate: '2024-13-01'
          })
        }) as any
      )

      expect(response.status).toBe(400)
      expect(goalCreateMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ error: 'Campo targetDate inválido' })
    })

    it('accepts valid targetDate values', async () => {
      const { POST } = await import('@/app/api/goals/route')

      const response = await POST(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            title: 'Travel Fund',
            targetAmount: '5000',
            targetDate: '2024-05-01T00:00:00.000Z'
          })
        }) as any
      )

      expect(response.status).toBe(201)
      expect(goalCreateMock).toHaveBeenCalledTimes(1)
      const payload = goalCreateMock.mock.calls[0][0].data
      expect(payload.targetDate).toBeInstanceOf(Date)
      expect((payload.targetDate as Date).toISOString()).toBe('2024-05-01T00:00:00.000Z')
    })

    it('rejects null targetDate values as missing', async () => {
      const { POST } = await import('@/app/api/goals/route')

      const response = await POST(
        new Request('http://localhost/api/goals', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({
            title: 'Travel Fund',
            targetAmount: '5000',
            targetDate: null
          })
        }) as any
      )

      expect(response.status).toBe(400)
      expect(goalCreateMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ error: 'Campos obrigatórios não preenchidos' })
    })
  })

  describe('PATCH /api/goals/[id]', () => {
    it('rejects invalid targetDate values', async () => {
      const { PATCH } = await import('@/app/api/goals/[id]/route')

      const response = await PATCH(
        new Request('http://localhost/api/goals/goal_1', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({
            targetDate: 'not-a-real-date'
          })
        }) as any,
        { params: { id: 'goal_1' } }
      )

      expect(response.status).toBe(400)
      expect(goalUpdateMock).not.toHaveBeenCalled()
      expect(await response.json()).toEqual({ error: 'Campo targetDate inválido' })
    })

    it('converts valid targetDate values to Date instances', async () => {
      const { PATCH } = await import('@/app/api/goals/[id]/route')

      const response = await PATCH(
        new Request('http://localhost/api/goals/goal_1', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({
            targetDate: '2024-05-01T00:00:00.000Z'
          })
        }) as any,
        { params: { id: 'goal_1' } }
      )

      expect(response.status).toBe(200)
      expect(goalUpdateMock).toHaveBeenCalledTimes(1)
      const payload = goalUpdateMock.mock.calls[0][0].data
      expect(payload.targetDate).toBeInstanceOf(Date)
      expect((payload.targetDate as Date).toISOString()).toBe('2024-05-01T00:00:00.000Z')
    })

    it('allows clearing targetDate with null', async () => {
      const { PATCH } = await import('@/app/api/goals/[id]/route')

      const response = await PATCH(
        new Request('http://localhost/api/goals/goal_1', {
          method: 'PATCH',
          headers: jsonHeaders,
          body: JSON.stringify({
            targetDate: null
          })
        }) as any,
        { params: { id: 'goal_1' } }
      )

      expect(response.status).toBe(200)
      expect(goalUpdateMock).toHaveBeenCalledTimes(1)
      const payload = goalUpdateMock.mock.calls[0][0].data
      expect(payload.targetDate).toBeNull()
    })
  })
})
