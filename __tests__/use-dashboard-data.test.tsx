import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const pushMock = vi.hoisted(() => vi.fn())
const userState = vi.hoisted(() => ({ isLoaded: true, isSignedIn: true }))
const createHandleConnectMock = vi.hoisted(() => vi.fn(() => vi.fn()))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@clerk/nextjs', () => ({
  useUser: () => userState,
}))

vi.mock('@/lib/pluggy-connect', () => ({
  createHandleConnect: createHandleConnectMock,
}))

const toastErrorMock = vi.hoisted(() => vi.fn())
const toastSuccessMock = vi.hoisted(() => vi.fn())

vi.mock('@/lib/toast', () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
    warning: vi.fn(),
    info: vi.fn(),
    dismiss: vi.fn(),
    update: vi.fn(),
    isActive: vi.fn(),
  },
}))

const { useDashboardData } = await import('@/hooks/use-dashboard-data')

const originalFetch = globalThis.fetch
const originalWindowFetch =
  typeof window === 'undefined' ? undefined : window.fetch

let fetchMock: ReturnType<typeof vi.fn>
let querySelectorSpy: ReturnType<typeof vi.spyOn> | null = null

describe('useDashboardData pagination', () => {
  beforeEach(() => {
    Object.assign(userState, { isLoaded: false, isSignedIn: true })
    pushMock.mockReset()
    createHandleConnectMock.mockReset()
    createHandleConnectMock.mockReturnValue(vi.fn())
    toastErrorMock.mockReset()
    toastSuccessMock.mockReset()

    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()

      if (url === '/api/pluggy/sync') {
        return new Response(JSON.stringify({ accounts: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (
        url === '/api/budget' ||
        url === '/api/goals' ||
        url === '/api/subscriptions' ||
        url === '/api/loans'
      ) {
        return new Response(JSON.stringify([]), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      if (url.startsWith('/api/transactions')) {
        const searchParams = new URL(url, 'https://example.com').searchParams
        const page = Number(searchParams.get('page') ?? '1')

        const body =
          page === 2
            ? {
                data: [
                  {
                    id: 'tx_page_2',
                    description: 'Second page',
                    amount: -25,
                    date: '2024-07-02T00:00:00.000Z',
                  },
                ],
                meta: {
                  page: 2,
                  pageSize: 10,
                  totalCount: 12,
                  totalPages: 2,
                  hasNextPage: false,
                  hasPreviousPage: true,
                },
              }
            : {
                data: [
                  {
                    id: 'tx_page_1',
                    description: 'First page',
                    amount: 100,
                    date: '2024-07-01T00:00:00.000Z',
                  },
                ],
                meta: {
                  page: 1,
                  pageSize: 10,
                  totalCount: 12,
                  totalPages: 2,
                  hasNextPage: true,
                  hasPreviousPage: false,
                },
              }

        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      throw new Error(`Unexpected fetch call: ${url}`)
    })

    ;(globalThis as any).fetch = fetchMock
    if (typeof window !== 'undefined') {
      ;(window as any).fetch = fetchMock
    }

    ;(window as any).PluggyConnect = undefined
    querySelectorSpy = vi.spyOn(document, 'querySelector').mockReturnValue(null)
  })

  afterEach(() => {
    vi.clearAllMocks()

    if (querySelectorSpy) {
      querySelectorSpy.mockRestore()
      querySelectorSpy = null
    }

    if (originalFetch) {
      globalThis.fetch = originalFetch
    } else {
      delete (globalThis as any).fetch
    }

    if (typeof window !== 'undefined') {
      if (originalWindowFetch) {
        window.fetch = originalWindowFetch
      } else {
        delete (window as any).fetch
      }
    }
  })

  it('loads the first page and fetches new data when navigating', async () => {
    const { result, rerender } = renderHook(() => useDashboardData())

    await act(async () => {
      await result.current.loadData({ page: 1, silent: true })
    })

    rerender()

    await waitFor(() => {
      expect(result.current.transactionsMeta?.page).toBe(1)
      expect(result.current.transactions).toHaveLength(1)
    })

    const firstPageCall = fetchMock.mock.calls.find(([url]) =>
      typeof url === 'string'
        ? url.includes('/api/transactions?page=1&pageSize=10')
        : url.toString().includes('/api/transactions?page=1&pageSize=10'),
    )
    expect(firstPageCall).toBeDefined()

    fetchMock.mockClear()

    await act(async () => {
      await result.current.handleTransactionsPageChange(2)
    })

    await waitFor(() => {
      expect(result.current.transactionPage).toBe(2)
      expect(result.current.transactionsMeta?.page).toBe(2)
    })

    expect(result.current.transactions[0]).toMatchObject({
      id: 'tx_page_2',
      amount: -25,
    })

    const nextPageCall = fetchMock.mock.calls.find(([url]) =>
      typeof url === 'string'
        ? url.includes('/api/transactions?page=2&pageSize=10')
        : url.toString().includes('/api/transactions?page=2&pageSize=10'),
    )
    expect(nextPageCall).toBeDefined()
  })

  it('prevents navigation beyond the available page range', async () => {
    const { result, rerender } = renderHook(() => useDashboardData())

    await act(async () => {
      await result.current.loadData({ page: 1, silent: true })
    })

    rerender()

    await waitFor(() => {
      expect(result.current.transactionsMeta?.totalPages).toBe(2)
    })

    fetchMock.mockClear()

    const outcome = result.current.handleTransactionsPageChange(3)

    expect(outcome).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.transactionPage).toBe(1)
  })
})

