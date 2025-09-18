import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { promisify } from 'node:util'
import { execFile } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs/promises'

const execFileAsync = promisify(execFile)

const DEPLOY_TIMEOUT_MS = Number(process.env.DEPLOY_TIMEOUT_MS ?? 10 * 60 * 1000)
const rawAllowedEmails = process.env.DEPLOY_ALLOWED_EMAILS
const allowedEmails = rawAllowedEmails
  ? rawAllowedEmails
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  : null

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function resolveUserEmail(userId: string) {
  const user = await clerkClient.users.getUser(userId)
  const primaryEmail =
    user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null

  return primaryEmail ? primaryEmail.toLowerCase() : null
}

export async function POST() {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const email = await resolveUserEmail(userId)

    if (allowedEmails && (!email || !allowedEmails.includes(email))) {
      return NextResponse.json({ error: 'Usuário sem permissão para deploy' }, { status: 403 })
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'deploy.sh')

    try {
      await fs.access(scriptPath)
    } catch {
      return NextResponse.json(
        { error: 'Script de deploy não encontrado no servidor', success: false },
        { status: 500 }
      )
    }

    const { stdout, stderr } = await execFileAsync(scriptPath, {
      cwd: process.cwd(),
      timeout: DEPLOY_TIMEOUT_MS,
      maxBuffer: 10 * 1024 * 1024,
    })

    return NextResponse.json({ success: true, stdout, stderr })
  } catch (error: unknown) {
    console.error('Erro ao executar deploy:', error)

    const execError = error as { stdout?: unknown; stderr?: unknown; message?: unknown }
    const stdout = typeof execError?.stdout === 'string' ? execError.stdout : undefined
    const stderr = typeof execError?.stderr === 'string' ? execError.stderr : undefined
    const message =
      typeof execError?.message === 'string'
        ? execError.message
        : error instanceof Error
          ? error.message
          : 'Erro desconhecido'

    return NextResponse.json(
      {
        success: false,
        error: message,
        stdout,
        stderr,
      },
      { status: 500 }
    )
  }
}
