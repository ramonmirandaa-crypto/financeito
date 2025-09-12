import type { NextApiRequest, NextApiResponse } from 'next'
import { createConnectToken } from '../../../lib/pluggy'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const data = await createConnectToken({})
  res.json(data) // { connectToken: '...' }
}
