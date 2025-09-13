import { NextRequest, NextResponse } from 'next/server'
import { login } from '@/lib/auth'
import { setAuthCookie } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  try {
    const { token, require2FA } = await login(email, password)
    const res = NextResponse.json({ ok: true, require2FA })
    if (require2FA) {
      res.headers.set('Authorization', `Bearer ${token}`)
    } else {
      setAuthCookie(res, token)
    }
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 })
  }
}
