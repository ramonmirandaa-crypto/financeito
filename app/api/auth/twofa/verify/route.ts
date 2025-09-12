import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { verifyJWT, verify2FASetup, verify2FAToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = req.cookies.get('session')?.value
  if (!session) return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  const payload = verifyJWT(session)
  const userId = payload.sub as string
  const { token, secret } = await req.json()
  if (!token) return NextResponse.json({ ok: false, error: 'Código ausente' }, { status: 400 })

  if (secret) {
    const ok = await verify2FASetup(userId, secret, token)
    if (!ok) return NextResponse.json({ ok: false, error: 'Código inválido' }, { status: 400 })
    return NextResponse.json({ ok: true })
  } else {
    const ok = await verify2FAToken(userId, token)
    if (!ok) return NextResponse.json({ ok: false, error: 'Código inválido' }, { status: 400 })
    const newToken = jwt.sign({ sub: userId, require2FA: false }, process.env.JWT_SECRET!, { expiresIn: '1h' })
    const res = NextResponse.json({ ok: true })
    res.cookies.set('session', newToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 3600,
    })
    return res
  }
}
