import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import * as speakeasy from 'speakeasy'
import { encryptJSON, decryptJSON } from './crypto'

const prisma = new PrismaClient()

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
  const requires2FA = !!user.twoFASecret
  const token = jwt.sign({ sub: user.id, requires2FA }, process.env.JWT_SECRET!, { expiresIn: '1h' })
  return { token, requires2FA }
}

export function verifyJWT(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET!) as any
}

export async function setup2FA(userId: string) {
  const secret = speakeasy.generateSecret({ length: 20, name: `${process.env.TOTP_ISSUER}:${userId}` })
  const enc = encryptJSON({ ascii: secret.ascii, base32: secret.base32, otpauth_url: secret.otpauth_url })
  await prisma.user.update({ where: { id: userId }, data: { twoFASecret: enc } })
  return secret.otpauth_url
}

export async function verify2FA(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user?.twoFASecret) return false
  const secret = decryptJSON(user.twoFASecret)
  return speakeasy.totp.verify({ secret: secret.base32, encoding: 'base32', token, window: 1 })
}
