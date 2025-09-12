import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import * as speakeasy from 'speakeasy'
import { prisma, signToken, setAuthCookie } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  try {
    const { email, password, code } = await req.json()
    if (!email || !password) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

    if (user.twoFASecret) {
      if (!code) {
        return NextResponse.json({ require2FA: true, message: 'Informe o código 2FA' }, { status: 401 })
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFASecret,
        encoding: 'base32',
        token: String(code),
        window: 1,
      })
      if (!verified) return NextResponse.json({ error: 'Código 2FA inválido' }, { status: 401 })
    }

    const token = signToken({ uid: user.id, email: user.email })
    const res = NextResponse.json({ ok: true, token })
    setAuthCookie(res, token)
    return res
  } catch {
    return NextResponse.json({ error: 'Falha no login' }, { status: 500 })
  }
}
