import axios from 'axios'

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

const BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai'
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET

let cachedApiKey: { key: string; exp: number } | null = null

async function getApiKey(): Promise<string> {
  const now = Date.now()
  if (cachedApiKey && now < cachedApiKey.exp) return cachedApiKey.key
  const credentials = resolveCredentials()
  const { data } = await axios.post(`${BASE_URL}/auth`, credentials)
  const key: string = data.apiKey || data.accessToken || data.token
  const ttlMs = (data.expiresIn ? Number(data.expiresIn) : 110 * 60) * 1000
  cachedApiKey = { key, exp: now + ttlMs }
  return key
}

function resolveCredentials(): { clientId: string; clientSecret: string } {
  const clientId = CLIENT_ID?.trim()
  const clientSecret = CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    const message =
      'PLUGGY_CLIENT_ID e/ou PLUGGY_CLIENT_SECRET não foram configurados. Defina as variáveis de ambiente antes de usar a integração.'
    console.error(message)
    throw new ConfigurationError(message)
  }

  return { clientId, clientSecret }
}

async function authHeaders() {
  const apiKey = await getApiKey()
  return { 'X-API-KEY': apiKey }
}

function normalizeConnectTokenResponse<T extends Record<string, any>>(data: T) {
  const connectToken =
    data.connectToken ?? data.connect_token ?? data.linkToken ?? data.link_token ?? data.token
  return { ...data, connectToken }
}

export async function createConnectToken(payload?: Record<string, any>) {
  const headers = await authHeaders()
  try {
    const { data } = await axios.post(`${BASE_URL}/connect_token`, payload || {}, { headers })
    return normalizeConnectTokenResponse(data)
  } catch {
    const { data } = await axios.post(`${BASE_URL}/link/token`, payload || {}, { headers })
    return normalizeConnectTokenResponse(data)
  }
}

export async function listTransactions(params: { itemId?: string; accountId?: string; page?: number; pageSize?: number }) {
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/transactions`, { params, headers })
  return data
}

export async function listAccounts(params: { itemId?: string; page?: number; pageSize?: number }) {
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/accounts`, { params, headers })
  return data
}

export async function listCreditCards(params: { itemId?: string; page?: number; pageSize?: number }) {
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/credit_cards`, { params, headers })
  return data
}

export async function listCreditCardTransactions(params: { creditCardId: string; page?: number; pageSize?: number }) {
  const { creditCardId, ...rest } = params
  if (!creditCardId) throw new Error('creditCardId is required')
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/credit_cards/${creditCardId}/transactions`, {
    params: rest,
    headers,
  })
  return data
}

export async function listInvestments(params: { itemId?: string; page?: number; pageSize?: number }) {
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/investments`, { params, headers })
  return data
}

export async function listInvestmentTransactions(params: { itemId?: string; page?: number; pageSize?: number }) {
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/investments/transactions`, { params, headers })
  return data
}

export async function listLoans(params: { itemId?: string; page?: number; pageSize?: number }) {
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/loans`, { params, headers })
  return data
}

export async function listLoanTransactions(params: { loanId: string; page?: number; pageSize?: number }) {
  const { loanId, ...rest } = params
  if (!loanId) throw new Error('loanId is required')
  const headers = await authHeaders()
  const { data } = await axios.get(`${BASE_URL}/loans/${loanId}/transactions`, {
    params: rest,
    headers,
  })
  return data
}
