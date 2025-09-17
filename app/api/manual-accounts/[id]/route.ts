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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const account = await prisma.bankAccount.findFirst({
      where: { id: params.id, userId, provider: 'manual' },
    })

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body?.name !== undefined) {
      updateData.name = validateStringField(body.name, 'Nome')
    }

    if (body?.currency !== undefined) {
      updateData.currency = validateStringField(body.currency, 'Moeda')
    }

    if (body?.balance !== undefined) {
      const balanceValue = validateBalance(body.balance)
      updateData.balance = new Prisma.Decimal(balanceValue)
    }

    const type =
      body?.type !== undefined
        ? typeof body.type === 'string' && body.type.trim() !== ''
          ? body.type.trim()
          : null
        : parseManualMetadata(account.dataEnc ?? null)?.type ?? null

    updateData.providerItem = type || null
    updateData.dataEnc = type ? JSON.stringify({ type }) : null

    const updated = await prisma.bankAccount.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(serializeManualAccount(updated))
  } catch (error) {
    console.error('Erro ao atualizar conta manual:', error)
    const message = error instanceof Error ? error.message : 'Erro interno'
    const status = message.includes('é obrigatório') || message.includes('inválido') ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const account = await prisma.bankAccount.findFirst({
      where: { id: params.id, userId, provider: 'manual' },
    })

    if (!account) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.transaction.deleteMany({ where: { accountId: account.id, userId } }),
      prisma.budgetItem.updateMany({
        where: { accountId: account.id, budget: { userId } },
        data: { accountId: null },
      }),
      prisma.bankAccount.delete({ where: { id: account.id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro ao remover conta manual:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
