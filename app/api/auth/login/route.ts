import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  try {
    const { token, requires2FA } = await login(email, password)
    const res = NextResponse.json({ ok: true, requires2FA })
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 3600,
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 })
  }
}
