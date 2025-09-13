import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import * as speakeasy from 'speakeasy'
import { encryptJSON, decryptJSON } from './crypto'
import { prisma } from './db'

export async function register(email: string, password: string) {
  const hash = await bcrypt.hash(password, Number(process.env.PASSWORD_HASH_ROUNDS || 12))
  const user = await prisma.user.create({ data: { email, passwordHash: hash } })
  return user
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw new Error('Credenciais inválidas')
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) throw new Error('Credenciais inválidas')
  const require2FA = !!user.twoFASecret
  const token = jwt.sign({ sub: user.id, require2FA }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return { token, require2FA }
}

export function verifyJWT(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as any
}

export function setup2FA(userId: string) {
  const secret = speakeasy.generateSecret({ length: 20, name: `${process.env.TOTP_ISSUER}:${userId}` })
  return { base32: secret.base32, otpauth_url: secret.otpauth_url }
}

export async function verify2FASetup(userId: string, secret: string, token: string) {
  const ok = speakeasy.totp.verify({ secret, encoding: 'base32', token })
  if (!ok) return false
  const enc = encryptJSON({ base32: secret })
  await prisma.user.update({ where: { id: userId }, data: { twoFASecret: enc } })
  return true
}

export async function verify2FAToken(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.twoFASecret) return false
  const secret = decryptJSON(user.twoFASecret)
  const base32 = secret.base32 || secret
  return speakeasy.totp.verify({ secret: base32, encoding: 'base32', token, window: 1 })
}
