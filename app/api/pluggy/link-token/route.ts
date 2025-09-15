import { NextRequest, NextResponse } from 'next/server'
import { createConnectToken } from '@/lib/pluggy'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await createConnectToken({})
  return NextResponse.json(data)
}
