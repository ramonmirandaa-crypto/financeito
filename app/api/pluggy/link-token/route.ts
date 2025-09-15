import { NextRequest, NextResponse } from 'next/server'
import { createConnectToken } from '@/lib/pluggy'
import { getAuthSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await createConnectToken({})
  return NextResponse.json(data)
}
