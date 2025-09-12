import { NextRequest, NextResponse } from 'next/server'
import { verify2FA, verifyJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const payload = verifyJWT(token!) as any
  const { token: code } = await req.json()
  const ok = await verify2FA(payload.sub, code)
  if (!ok) return NextResponse.json({ ok: false, error: 'Código inválido' }, { status: 400 })
  return NextResponse.json({ ok: true })
}
