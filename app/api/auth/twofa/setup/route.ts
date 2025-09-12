import { NextRequest, NextResponse } from 'next/server'
import { setup2FA, verifyJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const payload = verifyJWT(token!) as any
  const url = await setup2FA(payload.sub)
  return NextResponse.json({ otpauth_url: url })
}
