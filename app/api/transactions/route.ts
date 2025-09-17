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

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const { description, category, amount, date, accountId } = await request.json()

    if (typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'Descrição é obrigatória' }, { status: 400 })
    }

    if (typeof accountId !== 'string' || !accountId.trim()) {
      return NextResponse.json({ error: 'Conta bancária é obrigatória' }, { status: 400 })
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

    const normalizedAccountId = accountId.trim()
    const account = await prisma.bankAccount.findFirst({
      where: {
        id: normalizedAccountId,
        userId,
      },
    })

    if (!account) {
      return NextResponse.json(
        { error: 'Conta bancária não encontrada ou não pertence ao usuário.' },
        { status: 400 }
      )
    }

    const createdTransaction = await prisma.transaction.create({
      data: {
        accountId: account.id,
        userId,
        description: description.trim(),
        category:
          typeof category === 'string' && category.trim() !== ''
            ? category.trim()
            : null,
        currency: account.currency || 'BRL',
        amount: new Prisma.Decimal(numericAmount),
        date: parsedDate,
      },
    })

    return NextResponse.json(serializeTransaction(createdTransaction), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
