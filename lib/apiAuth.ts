import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

const COOKIE_NAME = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7 dias

export function signToken(sub: string, payload: object = {}) {
  const secret = process.env.JWT_SECRET!
  return jwt.sign({ sub, ...payload }, secret, { expiresIn: `${MAX_AGE}s` })
}

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET!
  return jwt.verify(token, secret) as any
}

export function getTokenFromRequest(req: NextRequest) {
  const auth = req.headers.get('authorization') || ''
  if (auth.startsWith('Bearer ')) return auth.slice(7)
  const c = req.cookies.get(COOKIE_NAME)
  return c?.value
}

export async function getUserFromRequest(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null
  try {
    const payload = verifyToken(token)
    if (payload?.require2FA) return null
    if (!payload?.sub) return null
    const user = await prisma.user.findUnique({ where: { id: payload.sub as string } })
    return user
  } catch {
    return null
  }
}

export function setAuthCookie(res: NextResponse, token: string) {
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE,
  })
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}
