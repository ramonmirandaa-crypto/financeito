import type { NextApiRequest, NextApiResponse } from 'next'
import { verify2FA, verifyJWT } from '../../../lib/auth'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const token = req.cookies['session']
  const payload = verifyJWT(token!) as any
  const ok = await verify2FA(payload.sub, req.body.token)
  if (!ok) return res.status(400).json({ ok:false, error:'Código inválido' })
  res.json({ ok:true })
}
