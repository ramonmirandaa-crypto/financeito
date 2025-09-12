import type { NextApiRequest, NextApiResponse } from 'next'
import { setup2FA } from '../../../lib/auth'
import { verifyJWT } from '../../../lib/auth'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const token = req.cookies['session']
  const payload = verifyJWT(token!) as any
  const url = await setup2FA(payload.sub)
  res.json({ otpauth_url: url })
}
