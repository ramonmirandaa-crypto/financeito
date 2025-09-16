import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

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

    const id = params.id
    const { description, category, amount, date } = await request.json()

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
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: {
        description: description.trim(),
        category:
          typeof category === 'string' && category.trim() !== ''
            ? category.trim()
            : null,
        amount: new Prisma.Decimal(numericAmount),
        date: parsedDate,
      },
    })

    return NextResponse.json(serializeTransaction(updatedTransaction))
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
