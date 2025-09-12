import type { NextApiRequest, NextApiResponse } from 'next'
import { register } from '../../../lib/auth'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { email, password } = req.body
  try {
    const user = await register(email, password)
    res.status(200).json({ ok: true, userId: user.id })
  } catch (e:any) {
    res.status(400).json({ ok:false, error: e.message })
  }
}
