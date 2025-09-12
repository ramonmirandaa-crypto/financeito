import type { NextApiRequest, NextApiResponse } from 'next'
import { login } from '../../../lib/auth'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  try {
    const { token, requires2FA } = await login(email, password)
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Secure; Path=/; SameSite=Lax; Max-Age=3600`)
    res.status(200).json({ ok: true, requires2FA })
  } catch (e:any) {
    res.status(400).json({ ok:false, error: e.message })
  }
}
