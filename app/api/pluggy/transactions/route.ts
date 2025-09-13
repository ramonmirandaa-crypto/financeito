import { NextRequest, NextResponse } from 'next/server'
import { listTransactions } from '@/lib/pluggy'
import { getUserFromRequest } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const itemId = searchParams.get('itemId') ?? undefined
  const accountId = searchParams.get('accountId') ?? undefined
  const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined
  const pageSize = searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : undefined
  const data = await listTransactions({ itemId, accountId, page, pageSize })
  return NextResponse.json(data)
}
