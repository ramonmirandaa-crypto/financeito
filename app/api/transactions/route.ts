import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'

const serializeTransaction = (transaction: any) => ({
  id: transaction.id,
  accountId: transaction.accountId,
  description: transaction.description,
  category: transaction.category,
  currency: transaction.currency,
  amount: Number(transaction.amount),
  date: transaction.date.toISOString(),
  isRecurring: transaction.isRecurring,
  createdAt: transaction.createdAt.toISOString(),
})

const ensureManualAccount = async (userId: string) => {
  const existingManualAccount = await prisma.bankAccount.findFirst({
    where: { userId, provider: 'manual' },
    orderBy: { createdAt: 'asc' },
  })

  if (existingManualAccount) {
    return existingManualAccount
  }

  return prisma.bankAccount.create({
    data: {
      userId,
      provider: 'manual',
      name: 'Conta Manual',
      currency: 'BRL',
      balance: new Prisma.Decimal(0),
      providerItem: 'Conta Manual',
      dataEnc: JSON.stringify({ type: 'Conta Manual' }),
    },
  })
}

const adjustManualAccountBalance = async (
  accountId: string,
  amount: number
) => {
  await prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      balance: { increment: new Prisma.Decimal(amount) },
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { description, category, amount, date, accountId } = await request.json()

    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Valor é obrigatório' }, { status: 400 })
    }

    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount)) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    if (typeof date !== 'string' || !date) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 })
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }

    await ensureUser(userId)

    const trimmedAccountId =
      typeof accountId === 'string' && accountId.trim() !== ''
        ? accountId.trim()
        : ''

    let targetAccount
    if (trimmedAccountId) {
      targetAccount = await prisma.bankAccount.findFirst({
        where: { id: trimmedAccountId, userId },
      })

      if (!targetAccount) {
        return NextResponse.json({ error: 'Conta bancária inválida' }, { status: 400 })
      }
    } else {
      const existingManualAccount = await prisma.bankAccount.findFirst({
        where: { userId, provider: 'manual' },
        orderBy: { createdAt: 'asc' },
      })

      if (existingManualAccount) {
        return NextResponse.json(
          { error: 'Selecione uma conta manual para registrar a transação.' },
          { status: 400 }
        )
      }

      targetAccount = await ensureManualAccount(userId)
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        accountId: targetAccount.id,
        description: description.trim(),
        category:
          typeof category === 'string' && category.trim() !== ''
            ? category.trim()
            : null,
        currency: targetAccount.currency || 'BRL',
        amount: new Prisma.Decimal(numericAmount),
        date: parsedDate,
      },
    })

    if (targetAccount.provider === 'manual') {
      await adjustManualAccountBalance(targetAccount.id, numericAmount)
    }

    return NextResponse.json(serializeTransaction(transaction), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
