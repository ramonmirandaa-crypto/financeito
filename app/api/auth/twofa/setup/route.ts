import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT, setup2FA } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  if (!token) return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 })
  const payload = verifyJWT(token)
  const userId = payload.sub as string
  const secret = setup2FA(userId)
  return NextResponse.json({ secret: secret.base32, otpauth_url: secret.otpauth_url })
}
