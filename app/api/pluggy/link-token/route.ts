import { NextRequest, NextResponse } from 'next/server'
import { createConnectToken } from '@/lib/pluggy'
import { getUserFromRequest } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await createConnectToken({})
  return NextResponse.json(data)
}
