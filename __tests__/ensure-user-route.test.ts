import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const getUserMock = vi.fn()

const userStore = new Map<string, any>()
const goalStore: any[] = []

const userUpsertMock = vi.fn(async ({ where, create, update }: any) => {
  const id = where.id
  if (userStore.has(id)) {
    const current = userStore.get(id)
    const updated = { ...current, ...update }
    userStore.set(id, updated)
    return updated
  }

  const newUser = { ...create }
  userStore.set(id, newUser)
  return newUser
})

const goalCreateMock = vi.fn(async ({ data }: any) => {
  if (!userStore.has(data.userId)) {
    throw Object.assign(new Error('Foreign key constraint failed on the field: `goal_userId_fkey`'), {
      code: 'P2003',
    })
  }

  const goal = {
    id: `goal_${goalStore.length + 1}`,
    userId: data.userId,
    title: data.title,
    description: data.description ?? null,
    targetAmount: data.targetAmount,
    currentAmount: data.currentAmount ?? 0,
    currency: data.currency ?? 'BRL',
    targetDate: data.targetDate,
    category: data.category ?? null,
    priority: data.priority ?? 'medium',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  goalStore.push(goal)
  return goal
})

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  clerkClient: {
    users: {
      getUser: getUserMock,
    },
  },
}))

vi.mock('@/lib/db', () => {
  const prisma = {
    user: {
      upsert: userUpsertMock,
    },
    goal: {
      create: goalCreateMock,
    },
  }

  return {
    prisma,
    default: prisma,
  }
})

describe('ensureUser integration in goal route', () => {
  beforeEach(() => {
    userStore.clear()
    goalStore.length = 0
    userUpsertMock.mockClear()
    goalCreateMock.mockClear()
    authMock.mockReset()
    getUserMock.mockReset()
  })

  it('creates the Prisma user before writing goal data', async () => {
    authMock.mockReturnValue({ userId: 'user_123' })
    getUserMock.mockResolvedValue({
      id: 'user_123',
      emailAddresses: [
        {
          id: 'email_1',
          emailAddress: 'user@example.com',
          verification: { status: 'verified' },
        },
      ],
      primaryEmailAddressId: 'email_1',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      fullName: 'Test User',
      imageUrl: 'https://example.com/avatar.png',
    })

    const { POST } = await import('@/app/api/goals/route')

    const request = new Request('http://localhost/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'New Goal',
        targetAmount: 100,
        targetDate: '2024-12-31T00:00:00.000Z',
      }),
    })

    const response = await POST(request as any)

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.title).toBe('New Goal')

    expect(userUpsertMock).toHaveBeenCalledTimes(1)
    expect(goalCreateMock).toHaveBeenCalledTimes(1)
    expect(userStore.has('user_123')).toBe(true)
    expect(goalStore).toHaveLength(1)
    expect(goalStore[0].userId).toBe('user_123')
  })
})
