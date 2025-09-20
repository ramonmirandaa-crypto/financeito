import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'
import { transactionUpdateSchema } from '@/lib/validation/transaction'

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
    const body = await request.json()
    const parsedResult = transactionUpdateSchema.safeParse(body)

    if (!parsedResult.success) {
      const { fieldErrors, formErrors } = parsedResult.error.flatten()
      return NextResponse.json(
        {
          error: 'Dados inválidos',
          fieldErrors,
          formErrors,
        },
        { status: 400 },
      )
    }

    const { description, category, amount, date, accountId } = parsedResult.data
    const parsedDate = new Date(date)

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

    let targetAccount: typeof existingTransaction.bankAccount | null =
      existingTransaction.bankAccount

    if (accountId) {
      targetAccount = await prisma.bankAccount.findFirst({
        where: { id: accountId, userId },
      })

      if (!targetAccount) {
        return NextResponse.json(
          {
            error: 'Conta bancária inválida',
            fieldErrors: { accountId: ['Conta bancária inválida'] },
            formErrors: [],
          },
          { status: 400 },
        )
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
        description,
        category,
        amount: new Prisma.Decimal(amount),
        date: parsedDate,
        currency: targetAccount?.currency || existingTransaction.currency,
      },
    })

    if (targetAccount) {
      if (targetAccount.id === previousAccountId) {
        if (targetAccount.provider === 'manual') {
          await adjustManualAccountBalance(
            targetAccount.id,
            amount - previousAmount
          )
        }
      } else {
        if (previousAccountProvider === 'manual') {
          await adjustManualAccountBalance(previousAccountId, -previousAmount)
        }

        if (targetAccount.provider === 'manual') {
          await adjustManualAccountBalance(targetAccount.id, amount)
        }
      }
    }

    return NextResponse.json(serializeTransaction(updatedTransaction))
  } catch (error) {
    console.error('Erro ao atualizar transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
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

    const transaction = await prisma.transaction.findFirst({
      where: { id: params.id, userId },
      include: { bankAccount: true },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      if (
        transaction.accountId &&
        transaction.bankAccount?.provider === 'manual'
      ) {
        const adjustment = new Prisma.Decimal(transaction.amount).mul(-1)
        await tx.bankAccount.update({
          where: { id: transaction.accountId },
          data: {
            balance: { increment: adjustment },
          },
        })
      }

      await tx.transaction.delete({ where: { id: transaction.id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir transação:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
