import { NextRequest, NextResponse } from 'next/server'
import { register } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  try {
    const user = await register(email, password)
    return NextResponse.json({ ok: true, userId: user.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 })
  }
}
