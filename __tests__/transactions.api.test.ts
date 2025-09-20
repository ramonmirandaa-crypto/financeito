import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'

const authMock = vi.fn()
const ensureUserMock = vi.fn()

const transactionCountMock = vi.fn()
const transactionFindManyMock = vi.fn()
const transactionCreateMock = vi.fn()
const transactionFindFirstMock = vi.fn()
const transactionUpdateMock = vi.fn()
const transactionDeleteMock = vi.fn()

const bankAccountFindFirstMock = vi.fn()
const bankAccountUpdateMock = vi.fn()

const prismaTransactionCallbackMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/ensure-user', () => ({
  ensureUser: ensureUserMock,
}))

vi.mock('@/lib/db', () => {
  const prisma = {
    transaction: {
      count: transactionCountMock,
      findMany: transactionFindManyMock,
      create: transactionCreateMock,
      findFirst: transactionFindFirstMock,
      update: transactionUpdateMock,
    },
    bankAccount: {
      findFirst: bankAccountFindFirstMock,
      create: vi.fn(),
      update: bankAccountUpdateMock,
    },
    $transaction: prismaTransactionCallbackMock,
  }

  return {
    prisma,
    default: prisma,
  }
})

const { GET: listTransactions, POST: createTransaction } =
  await import('@/app/api/transactions/route')
const { PUT: updateTransaction, DELETE: deleteTransaction } =
  await import('@/app/api/transactions/[id]/route')

const buildRequest = (url: string, init?: RequestInit) =>
  new Request(url, init) as unknown as NextRequest

describe('transactions API routes', () => {
  beforeEach(() => {
    authMock.mockReset()
    ensureUserMock.mockReset()

    transactionCountMock.mockReset()
    transactionFindManyMock.mockReset()
    transactionCreateMock.mockReset()
    transactionFindFirstMock.mockReset()
    transactionUpdateMock.mockReset()
    transactionDeleteMock.mockReset()

    bankAccountFindFirstMock.mockReset()
    bankAccountUpdateMock.mockReset()

    prismaTransactionCallbackMock.mockReset()

    authMock.mockReturnValue({ userId: 'user_123' })
    ensureUserMock.mockResolvedValue(undefined)

    prismaTransactionCallbackMock.mockImplementation(async (callback: any) =>
      callback({
        transaction: { delete: transactionDeleteMock },
        bankAccount: { update: bankAccountUpdateMock },
      }),
    )
  })

  it('returns paginated transactions for authenticated users', async () => {
    transactionCountMock.mockResolvedValue(3)
    const createdAt = new Date('2024-06-01T10:00:00.000Z')
    const date = new Date('2024-05-20T00:00:00.000Z')
    transactionFindManyMock.mockResolvedValue([
      {
        id: 'tx_1',
        userId: 'user_123',
        accountId: 'acct_manual',
        description: 'Lunch',
        category: 'food',
        currency: 'BRL',
        amount: new Prisma.Decimal(25.5),
        date,
        isRecurring: false,
        createdAt,
      },
    ])

    const request = buildRequest(
      'https://example.com/api/transactions?page=2&pageSize=1',
    )

    const response = await listTransactions(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({
      data: [
        {
          id: 'tx_1',
          accountId: 'acct_manual',
          description: 'Lunch',
          category: 'food',
          currency: 'BRL',
          amount: 25.5,
          date: date.toISOString(),
          isRecurring: false,
          createdAt: createdAt.toISOString(),
        },
      ],
      meta: {
        page: 2,
        pageSize: 1,
        totalCount: 3,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      },
    })

    expect(ensureUserMock).toHaveBeenCalledWith('user_123')
    expect(transactionFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user_123' },
        skip: 1,
        take: 1,
      }),
    )
  })

  it('validates pagination parameters', async () => {
    const request = buildRequest(
      'https://example.com/api/transactions?page=abc',
    )

    const response = await listTransactions(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json).toEqual({ error: 'Página inválida' })
    expect(transactionCountMock).not.toHaveBeenCalled()
  })

  it('creates transactions and adjusts manual account balances', async () => {
    const manualAccount = {
      id: 'acct_manual',
      userId: 'user_123',
      provider: 'manual',
      currency: 'BRL',
      balance: new Prisma.Decimal(100),
    }

    bankAccountFindFirstMock.mockResolvedValue(manualAccount)
    transactionCreateMock.mockResolvedValue({
      id: 'tx_manual',
      userId: 'user_123',
      accountId: 'acct_manual',
      description: 'Groceries',
      category: 'food',
      currency: 'BRL',
      amount: new Prisma.Decimal(50),
      date: new Date('2024-07-01T00:00:00.000Z'),
      isRecurring: false,
      createdAt: new Date('2024-07-02T00:00:00.000Z'),
    })

    const request = buildRequest('https://example.com/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Groceries',
        category: 'food',
        amount: 50,
        date: '2024-07-01',
        accountId: 'acct_manual',
      }),
    })

    const response = await createTransaction(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json).toMatchObject({
      id: 'tx_manual',
      accountId: 'acct_manual',
      description: 'Groceries',
      amount: 50,
    })

    const balanceIncrement = bankAccountUpdateMock.mock.calls.at(-1)?.[0]?.data
      ?.balance?.increment
    expect(balanceIncrement?.toString()).toBe('50')
  })

  it('returns validation errors for invalid payloads', async () => {
    const request = buildRequest('https://example.com/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: '',
        amount: '',
        date: '',
        accountId: null,
      }),
    })

    const response = await createTransaction(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Dados inválidos')
    expect(json.fieldErrors).toBeDefined()
    expect(transactionCreateMock).not.toHaveBeenCalled()
  })

  it('updates manual transactions and reconciles balances', async () => {
    const existingTransaction = {
      id: 'tx_manual',
      userId: 'user_123',
      accountId: 'acct_manual',
      description: 'Groceries',
      category: 'food',
      currency: 'BRL',
      amount: new Prisma.Decimal(40),
      date: new Date('2024-07-01T00:00:00.000Z'),
      createdAt: new Date('2024-07-01T00:00:00.000Z'),
      bankAccount: {
        id: 'acct_manual',
        provider: 'manual',
        currency: 'BRL',
      },
    }

    transactionFindFirstMock.mockResolvedValue(existingTransaction)
    bankAccountFindFirstMock.mockResolvedValue(existingTransaction.bankAccount)
    transactionUpdateMock.mockResolvedValue({
      ...existingTransaction,
      amount: new Prisma.Decimal(55),
      description: 'Updated Groceries',
    })

    const request = buildRequest(
      'https://example.com/api/transactions/tx_manual',
      {
        method: 'PUT',
        body: JSON.stringify({
          description: 'Updated Groceries',
          category: 'food',
          amount: 55,
          date: '2024-07-02',
          accountId: 'acct_manual',
        }),
      },
    )

    const response = await updateTransaction(request, {
      params: { id: 'tx_manual' },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toMatchObject({
      id: 'tx_manual',
      description: 'Updated Groceries',
      amount: 55,
    })

    const balanceIncrement = bankAccountUpdateMock.mock.calls.at(-1)?.[0]?.data
      ?.balance?.increment
    expect(balanceIncrement?.toString()).toBe('15')
  })

  it('deletes manual transactions and rolls back balances', async () => {
    transactionFindFirstMock.mockResolvedValue({
      id: 'tx_manual',
      userId: 'user_123',
      accountId: 'acct_manual',
      amount: new Prisma.Decimal(30),
      bankAccount: { id: 'acct_manual', provider: 'manual' },
    })

    const request = buildRequest(
      'https://example.com/api/transactions/tx_manual',
    )

    const response = await deleteTransaction(request, {
      params: { id: 'tx_manual' },
    })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json).toEqual({ success: true })

    expect(transactionDeleteMock).toHaveBeenCalledWith({
      where: { id: 'tx_manual' },
    })

    const balanceIncrement = bankAccountUpdateMock.mock.calls.at(-1)?.[0]?.data
      ?.balance?.increment
    expect(balanceIncrement?.toString()).toBe('-30')
  })
})

