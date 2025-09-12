import axios from 'axios'
const BASE_URL = process.env.PLUGGY_BASE_URL || 'https://api.pluggy.ai'
const CLIENT_ID = process.env.PLUGGY_CLIENT_ID!
const CLIENT_SECRET = process.env.PLUGGY_CLIENT_SECRET!

let cachedApiKey: { key: string; exp: number } | null = null

async function getApiKey(): Promise<string> {
  const now = Date.now()
  if (cachedApiKey && now < cachedApiKey.exp) return cachedApiKey.key
  const { data } = await axios.post(`${BASE_URL}/auth`, { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })
  const key: string = data.apiKey || data.accessToken || data.token
  const ttlMs = (data.expiresIn ? Number(data.expiresIn) : 110 * 60) * 1000
  cachedApiKey = { key, exp: now + ttlMs }
  return key
}

async function authHeaders() {
  const apiKey = await getApiKey()
  return { 'X-API-KEY': apiKey }
}

export async function createConnectToken(payload?: Record<string, any>) {
  const headers = await authHeaders()
  try {
    const { data } = await axios.post(`${BASE_URL}/connect_token`, payload || {}, { headers })
    return data
  } catch {
    const { data } = await axios.post(`${BASE_URL}/link/token`, payload || {}, { headers })
    return data
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
