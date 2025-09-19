'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useToast } from './use-toast'

type CrudOperation = 'fetch' | 'create' | 'update' | 'delete'

interface OperationMessages {
  errorTitle: string
  fallbackMessage?: string
  networkErrorTitle?: string
  networkFallbackMessage?: string
}

export type ResourceMessages = Partial<Record<CrudOperation, OperationMessages>>

type ItemIdExtractor<TResource> = (item: TResource) => string

type CreatePayloadFn<TCreate> = (data: TCreate) => unknown

type UpdatePayloadFn<TUpdate, TResource> = (data: TUpdate, currentItem: TResource | null) => unknown

type TransformListFn<TResource> = (data: any) => TResource[]

type TransformItemFn<TResource> = (data: any) => TResource

export interface UseResourceCrudOptions<TResource, TCreate, TUpdate> {
  baseUrl: string
  /**
   * Query string key used to automatically open the create form when equals to "1".
   * Defaults to `create`.
   */
  queryParamKey?: string
  /**
   * Enables the logic that listens to the query string to open the create form.
   * Defaults to `true`.
   */
  enableCreateQueryParam?: boolean
  /**
   * Function responsible for extracting the identifier from a resource.
   * Defaults to reading the `id` property.
   */
  getItemId?: ItemIdExtractor<TResource>
  /**
   * Function used to transform the response when fetching the resource list.
   */
  transformList?: TransformListFn<TResource>
  /**
   * Function used to transform single resource responses (create/update).
   */
  transformItem?: TransformItemFn<TResource>
  /**
   * Function that prepares the payload used in create requests.
   */
  getCreatePayload?: CreatePayloadFn<TCreate>
  /**
   * Function that prepares the payload used in update requests.
   */
  getUpdatePayload?: UpdatePayloadFn<TUpdate, TResource>
  /**
   * Optional handler for unauthorized (401) responses.
   */
  onUnauthorized?: () => void
  /**
   * Message configuration used when showing toast errors.
   */
  messages?: ResourceMessages
  /**
   * When true, newly created items are prepended to the list. Defaults to `true`.
   */
  prependNewItems?: boolean
}

export interface UseResourceCrudReturn<TResource, TCreate, TUpdate> {
  items: TResource[]
  loading: boolean
  error: string | null
  showCreateForm: boolean
  openCreateForm: () => void
  closeCreateForm: () => void
  editingItem: TResource | null
  startEditing: (item: TResource) => void
  cancelEditing: () => void
  deletingItemId: string | null
  requestDelete: (id: string) => void
  cancelDelete: () => void
  createItem: (data: TCreate) => Promise<TResource | null>
  updateItem: (id: string, data: TUpdate) => Promise<TResource | null>
  deleteItem: (id: string) => Promise<boolean>
  reload: () => Promise<void>
  isSubmitting: boolean
  isDeleting: boolean
}

const DEFAULT_FALLBACK_MESSAGE = 'Tente novamente em instantes.'
const DEFAULT_NETWORK_MESSAGE = 'Verifique sua conexão e tente novamente.'

async function extractErrorMessage(response: Response) {
  try {
    const data = await response.json()
    if (!data) return undefined
    if (typeof data === 'string') return data
    if (typeof data.message === 'string') return data.message
    if (typeof data.error === 'string') return data.error
    return undefined
  } catch {
    return undefined
  }
}

export function useResourceCrud<TResource, TCreate = Partial<TResource>, TUpdate = TCreate>(
  options: UseResourceCrudOptions<TResource, TCreate, TUpdate>
): UseResourceCrudReturn<TResource, TCreate, TUpdate> {
  const {
    baseUrl,
    queryParamKey = 'create',
    enableCreateQueryParam = true,
    getItemId,
    transformList,
    transformItem,
    getCreatePayload,
    getUpdatePayload,
    onUnauthorized,
    messages,
    prependNewItems = true
  } = options

  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [items, setItems] = useState<TResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingItem, setEditingItem] = useState<TResource | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)
  const [hasOpenedFromQuery, setHasOpenedFromQuery] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const transformListRef = useRef(transformList)
  const transformItemRef = useRef(transformItem)
  const createPayloadRef = useRef(getCreatePayload)
  const updatePayloadRef = useRef(getUpdatePayload)
  const getItemIdRef = useRef<ItemIdExtractor<TResource> | undefined>(getItemId)
  const unauthorizedRef = useRef(onUnauthorized)
  const messagesRef = useRef(messages)
  const editingItemRef = useRef<TResource | null>(null)

  useEffect(() => {
    transformListRef.current = transformList
  }, [transformList])

  useEffect(() => {
    transformItemRef.current = transformItem
  }, [transformItem])

  useEffect(() => {
    createPayloadRef.current = getCreatePayload
  }, [getCreatePayload])

  useEffect(() => {
    updatePayloadRef.current = getUpdatePayload
  }, [getUpdatePayload])

  useEffect(() => {
    getItemIdRef.current = getItemId
  }, [getItemId])

  useEffect(() => {
    unauthorizedRef.current = onUnauthorized
  }, [onUnauthorized])

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    editingItemRef.current = editingItem
  }, [editingItem])

  const defaultGetItemId = useCallback((item: TResource) => {
    const inferredId = (item as unknown as { id?: string | number })?.id
    if (typeof inferredId === 'string') {
      return inferredId
    }
    if (typeof inferredId === 'number') {
      return String(inferredId)
    }
    throw new Error('No `id` field found in resource item. Provide a custom `getItemId` function.')
  }, [])

  const defaultOnUnauthorized = useCallback(() => {
    toast.error('Sessão expirada', 'Faça login novamente para continuar.')
    router.push('/login')
  }, [router, toast])

  const getOperationMessages = useCallback((operation: CrudOperation) => messagesRef.current?.[operation], [])

  const handleUnauthorized = useCallback(() => {
    if (unauthorizedRef.current) {
      unauthorizedRef.current()
      return
    }
    defaultOnUnauthorized()
  }, [defaultOnUnauthorized])

  const applyListTransform = useCallback(
    (data: any): TResource[] => {
      const transformer = transformListRef.current
      if (transformer) {
        return transformer(data)
      }
      return data
    },
    []
  )

  const applyItemTransform = useCallback(
    (data: any): TResource => {
      const transformer = transformItemRef.current
      if (transformer) {
        return transformer(data)
      }
      return data
    },
    []
  )

  const getId = useCallback(
    (item: TResource) => {
      const extractor = getItemIdRef.current
      if (extractor) {
        return extractor(item)
      }
      return defaultGetItemId(item)
    },
    [defaultGetItemId]
  )

  const openCreateForm = useCallback(() => {
    setEditingItem(null)
    setShowCreateForm(true)
  }, [])

  const closeCreateForm = useCallback(() => {
    setShowCreateForm(false)
  }, [])

  const startEditing = useCallback((item: TResource) => {
    setShowCreateForm(false)
    setEditingItem(item)
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingItem(null)
  }, [])

  const requestDelete = useCallback((id: string) => {
    setDeletingItemId(id)
  }, [])

  const cancelDelete = useCallback(() => {
    setDeletingItemId(null)
  }, [])

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(baseUrl)

      if (!response.ok) {
        if (response.status === 401) {
          handleUnauthorized()
          return
        }

        const serverMessage = await extractErrorMessage(response)
        const operationMessages = getOperationMessages('fetch')
        const title = operationMessages?.errorTitle ?? 'Não foi possível carregar os dados.'
        const description = serverMessage ?? operationMessages?.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE

        setError(description ?? title)
        toast.error(title, description)
        return
      }

      const data = await response.json()
      const transformed = applyListTransform(data)
      setItems(transformed)
      setError(null)
    } catch (error) {
      console.error(`Erro ao carregar recursos de ${baseUrl}:`, error)
      const operationMessages = getOperationMessages('fetch')
      const title = operationMessages?.networkErrorTitle ?? operationMessages?.errorTitle ?? 'Erro ao carregar dados.'
      const description = operationMessages?.networkFallbackMessage ?? DEFAULT_NETWORK_MESSAGE
      setError(description ?? title)
      toast.error(title, description)
    } finally {
      setLoading(false)
    }
  }, [applyListTransform, baseUrl, getOperationMessages, handleUnauthorized, toast])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  useEffect(() => {
    if (!enableCreateQueryParam) return
    if (hasOpenedFromQuery) return
    if (!searchParams) return

    if (searchParams.get(queryParamKey) === '1') {
      setShowCreateForm(true)
      setHasOpenedFromQuery(true)

      const params = new URLSearchParams(searchParams.toString())
      params.delete(queryParamKey)
      const queryString = params.toString()
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false })
    }
  }, [enableCreateQueryParam, hasOpenedFromQuery, pathname, queryParamKey, router, searchParams])

  const createItem = useCallback(
    async (data: TCreate): Promise<TResource | null> => {
      setIsSubmitting(true)
      setError(null)

      try {
        const payloadCreator = createPayloadRef.current
        const payload = payloadCreator ? payloadCreator(data) : data

        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
            return null
          }

          const serverMessage = await extractErrorMessage(response)
          const operationMessages = getOperationMessages('create')
          const title = operationMessages?.errorTitle ?? 'Não foi possível criar o registro.'
          const description = serverMessage ?? operationMessages?.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE

          setError(description ?? title)
          toast.error(title, description)
          return null
        }

        const created = applyItemTransform(await response.json())
        setItems(prev => (prependNewItems ? [created, ...prev] : [...prev, created]))
        setShowCreateForm(false)
        setError(null)
        return created
      } catch (error) {
        console.error(`Erro ao criar recurso em ${baseUrl}:`, error)
        const operationMessages = getOperationMessages('create')
        const title = operationMessages?.networkErrorTitle ?? operationMessages?.errorTitle ?? 'Erro ao criar registro.'
        const description = operationMessages?.networkFallbackMessage ?? DEFAULT_NETWORK_MESSAGE
        setError(description ?? title)
        toast.error(title, description)
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [applyItemTransform, baseUrl, getOperationMessages, handleUnauthorized, prependNewItems, toast]
  )

  const updateItem = useCallback(
    async (id: string, data: TUpdate): Promise<TResource | null> => {
      setIsSubmitting(true)
      setError(null)

      try {
        const payloadCreator = updatePayloadRef.current
        const payload = payloadCreator ? payloadCreator(data, editingItemRef.current) : data

        const response = await fetch(`${baseUrl}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
            return null
          }

          const serverMessage = await extractErrorMessage(response)
          const operationMessages = getOperationMessages('update')
          const title = operationMessages?.errorTitle ?? 'Não foi possível atualizar o registro.'
          const description = serverMessage ?? operationMessages?.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE

          setError(description ?? title)
          toast.error(title, description)
          return null
        }

        const updated = applyItemTransform(await response.json())
        setItems(prev => prev.map(item => (getId(item) === id ? updated : item)))
        setEditingItem(null)
        setError(null)
        return updated
      } catch (error) {
        console.error(`Erro ao atualizar recurso em ${baseUrl}:`, error)
        const operationMessages = getOperationMessages('update')
        const title = operationMessages?.networkErrorTitle ?? operationMessages?.errorTitle ?? 'Erro ao atualizar registro.'
        const description = operationMessages?.networkFallbackMessage ?? DEFAULT_NETWORK_MESSAGE
        setError(description ?? title)
        toast.error(title, description)
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [applyItemTransform, baseUrl, getId, getOperationMessages, handleUnauthorized, toast]
  )

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const response = await fetch(`${baseUrl}/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized()
            return false
          }

          const serverMessage = await extractErrorMessage(response)
          const operationMessages = getOperationMessages('delete')
          const title = operationMessages?.errorTitle ?? 'Não foi possível excluir o registro.'
          const description = serverMessage ?? operationMessages?.fallbackMessage ?? DEFAULT_FALLBACK_MESSAGE

          setError(description ?? title)
          toast.error(title, description)
          return false
        }

        setItems(prev => prev.filter(item => getId(item) !== id))
        setError(null)
        return true
      } catch (error) {
        console.error(`Erro ao excluir recurso em ${baseUrl}:`, error)
        const operationMessages = getOperationMessages('delete')
        const title = operationMessages?.networkErrorTitle ?? operationMessages?.errorTitle ?? 'Erro ao excluir registro.'
        const description = operationMessages?.networkFallbackMessage ?? DEFAULT_NETWORK_MESSAGE
        setError(description ?? title)
        toast.error(title, description)
        return false
      } finally {
        setIsDeleting(false)
        setDeletingItemId(null)
      }
    },
    [baseUrl, getId, getOperationMessages, handleUnauthorized, toast]
  )

  const reload = useCallback(async () => {
    await loadItems()
  }, [loadItems])

  return {
    items,
    loading,
    error,
    showCreateForm,
    openCreateForm,
    closeCreateForm,
    editingItem,
    startEditing,
    cancelEditing,
    deletingItemId,
    requestDelete,
    cancelDelete,
    createItem,
    updateItem,
    deleteItem,
    reload,
    isSubmitting,
    isDeleting
  }
}
