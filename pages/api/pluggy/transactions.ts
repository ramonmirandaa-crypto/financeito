import type { NextApiRequest, NextApiResponse } from 'next'
import { listTransactions } from '../../../lib/pluggy'
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { itemId, accountId, page, pageSize } = req.query
  const data = await listTransactions({
    itemId: itemId ? String(itemId) : undefined,
    accountId: accountId ? String(accountId) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  })
  res.json(data)
}
