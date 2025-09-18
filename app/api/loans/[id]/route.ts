import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const id = params.id
    const data = await request.json()

    let amountNumber: number | undefined
    if (data.amount !== undefined) {
      amountNumber = Number(data.amount)
      if (Number.isNaN(amountNumber)) {
        return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
      }
    }

    let interestRateNumber: number | undefined
    if (data.interestRate !== undefined) {
      interestRateNumber = Number(data.interestRate)
      if (Number.isNaN(interestRateNumber)) {
        return NextResponse.json({ error: 'Campo interestRate inválido' }, { status: 400 })
      }
    }

    let installmentCountValue: number | null | undefined
    if (data.installmentCount !== undefined) {
      if (data.installmentCount === null || `${data.installmentCount}`.trim() === '') {
        installmentCountValue = null
      } else {
        const parsedInstallmentCount = Number(data.installmentCount)
        if (!Number.isInteger(parsedInstallmentCount) || parsedInstallmentCount <= 0) {
          return NextResponse.json({ error: 'Campo installmentCount inválido' }, { status: 400 })
        }
        installmentCountValue = parsedInstallmentCount
      }
    }

    // Verify loan belongs to user
    const existingLoan = await prisma.loan.findFirst({
      where: { id, userId }
    })

    if (!existingLoan) {
      return NextResponse.json({ error: 'Empréstimo não encontrado' }, { status: 404 })
    }

    // Update loan
    const loan = await prisma.loan.update({
      where: { id },
      data: {
        ...data,
        amount: amountNumber,
        interestRate: interestRateNumber,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        installmentCount: installmentCountValue,
        paidAt: data.isPaid && !existingLoan.isPaid ? new Date() : data.isPaid === false ? null : undefined
      }
    })

    // Convert Decimal to number for JSON serialization
    const formattedLoan = {
      ...loan,
      amount: Number(loan.amount),
      interestRate: loan.interestRate ? Number(loan.interestRate) : null,
    }

    return NextResponse.json(formattedLoan)
  } catch (error) {
    console.error('Erro ao atualizar empréstimo:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const id = params.id

    // Verify loan belongs to user
    const existingLoan = await prisma.loan.findFirst({
      where: { id, userId }
    })

    if (!existingLoan) {
      return NextResponse.json({ error: 'Empréstimo não encontrado' }, { status: 404 })
    }

    // Delete loan
    await prisma.loan.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar empréstimo:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}