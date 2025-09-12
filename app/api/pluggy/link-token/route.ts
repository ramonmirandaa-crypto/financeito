import { NextRequest, NextResponse } from 'next/server'
import { createConnectToken } from '@/lib/pluggy'

export async function POST(req: NextRequest) {
  const data = await createConnectToken({})
  return NextResponse.json(data)
}
