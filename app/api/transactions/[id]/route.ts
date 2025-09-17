import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        userId,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    return NextResponse.json(serializeTransaction(transaction))
  } catch (error) {
    console.error('Erro ao buscar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const id = params.id
    const { description, category, amount, date, accountId } = await request.json()

    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json({ error: 'Valor é obrigatório' }, { status: 400 })
    }

    const numericAmount = Number(amount)
    if (Number.isNaN(numericAmount)) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })
    }

    if (typeof date !== 'string' || !date) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 })
    }

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'Data inválida' }, { status: 400 })
    }

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
      include: { bankAccount: true },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    const trimmedAccountId =
      typeof accountId === 'string' && accountId.trim() !== ''
        ? accountId.trim()
        : ''

    let targetAccount = existingTransaction.bankAccount

    if (trimmedAccountId) {
      targetAccount = await prisma.bankAccount.findFirst({
        where: { id: trimmedAccountId, userId },
      })

      if (!targetAccount) {
        return NextResponse.json({ error: 'Conta bancária inválida' }, { status: 400 })
      }
    } else if (!targetAccount) {
      targetAccount = await prisma.bankAccount.findFirst({
        where: { userId, provider: 'manual' },
        orderBy: { createdAt: 'asc' },
      })

      if (!targetAccount) {
        targetAccount = await prisma.bankAccount.create({
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
    }

    const previousAmount = Number(existingTransaction.amount)
    const previousAccountId = existingTransaction.accountId
    const previousAccountProvider = existingTransaction.bankAccount?.provider

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        accountId: targetAccount?.id ?? existingTransaction.accountId,
        description: description.trim(),
        category:
          typeof category === 'string' && category.trim() !== ''
            ? category.trim()
            : null,
        amount: new Prisma.Decimal(numericAmount),
        date: parsedDate,
        currency: targetAccount?.currency || existingTransaction.currency,
      },
    })

    if (targetAccount) {
      if (targetAccount.id === previousAccountId) {
        if (targetAccount.provider === 'manual') {
          await adjustManualAccountBalance(
            targetAccount.id,
            numericAmount - previousAmount
          )
        }
      } else {
        if (previousAccountProvider === 'manual') {
          await adjustManualAccountBalance(previousAccountId, -previousAmount)
        }

        if (targetAccount.provider === 'manual') {
          await adjustManualAccountBalance(targetAccount.id, numericAmount)
        }
      }
    }

    return NextResponse.json(serializeTransaction(updatedTransaction))
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
