import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'

const parseManualMetadata = (value: string | null) => {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch (error) {
    console.warn('Falha ao interpretar metadata de conta manual:', error)
    return null
  }
}

const serializeManualAccount = (account: any) => {
  const metadata = parseManualMetadata(account.dataEnc ?? null)
  return {
    id: account.id,
    name: account.name,
    currency: account.currency,
    balance: Number(account.balance),
    provider: account.provider,
    type:
      typeof metadata?.type === 'string'
        ? metadata.type
        : typeof account.providerItem === 'string'
          ? account.providerItem
          : null,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  }
}

const validateStringField = (value: unknown, fieldName: string) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${fieldName} é obrigatório`)
  }
  return value.trim()
}

const validateBalance = (value: unknown) => {
  if (value === undefined || value === null) {
    throw new Error('Saldo é obrigatório')
  }
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    throw new Error('Saldo inválido')
  }
  return numeric
}

export async function GET() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const accounts = await prisma.bankAccount.findMany({
      where: { userId, provider: 'manual' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(accounts.map(serializeManualAccount))
  } catch (error) {
    console.error('Erro ao listar contas manuais:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const body = await request.json()
    const name = validateStringField(body?.name, 'Nome')
    const currency = validateStringField(body?.currency, 'Moeda')
    const balanceValue = validateBalance(body?.balance)
    const type = typeof body?.type === 'string' ? body.type.trim() : null

    const account = await prisma.bankAccount.create({
      data: {
        userId,
        provider: 'manual',
        name,
        currency,
        balance: new Prisma.Decimal(balanceValue),
        providerItem: type || null,
        dataEnc: type ? JSON.stringify({ type }) : null,
      },
    })

    return NextResponse.json(serializeManualAccount(account), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar conta manual:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    const status = message.includes('é obrigatório') || message.includes('inválido') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
