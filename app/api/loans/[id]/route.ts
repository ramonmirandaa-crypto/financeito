import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'
import { serializeLoan } from '@/lib/prisma-serializers'

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

    let interestRateValue: number | null | undefined
    if (Object.prototype.hasOwnProperty.call(data, 'interestRate')) {
      if (data.interestRate === null || `${data.interestRate}`.trim() === '') {
        interestRateValue = null
      } else {
        const parsedInterestRate = Number(data.interestRate)
        if (Number.isNaN(parsedInterestRate)) {
          return NextResponse.json({ error: 'Campo interestRate inválido' }, { status: 400 })
        }
        interestRateValue = parsedInterestRate
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

    const updateData: Record<string, any> = {}

    if (Object.prototype.hasOwnProperty.call(data, 'title')) {
      updateData.title = data.title
    }

    if (Object.prototype.hasOwnProperty.call(data, 'description')) {
      updateData.description = data.description
    }

    if (Object.prototype.hasOwnProperty.call(data, 'amount')) {
      if (data.amount !== undefined) {
        updateData.amount = amountNumber
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'currency')) {
      updateData.currency = data.currency
    }

    if (Object.prototype.hasOwnProperty.call(data, 'lenderName')) {
      updateData.lenderName = data.lenderName
    }

    if (Object.prototype.hasOwnProperty.call(data, 'lenderContact')) {
      updateData.lenderContact = data.lenderContact
    }

    if (Object.prototype.hasOwnProperty.call(data, 'type')) {
      updateData.type = data.type
    }

    if (Object.prototype.hasOwnProperty.call(data, 'interestRate')) {
      updateData.interestRate = interestRateValue
    }

    if (Object.prototype.hasOwnProperty.call(data, 'installmentCount')) {
      updateData.installmentCount = installmentCountValue
    }

    if (Object.prototype.hasOwnProperty.call(data, 'dueDate')) {
      if (data.dueDate === null || (typeof data.dueDate === 'string' && data.dueDate.trim() === '')) {
        updateData.dueDate = null
      } else if (data.dueDate) {
        updateData.dueDate = new Date(data.dueDate)
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isPaid')) {
      updateData.isPaid = data.isPaid

      if (data.isPaid && !existingLoan.isPaid) {
        updateData.paidAt = new Date()
      } else if (data.isPaid === false && existingLoan.isPaid) {
        updateData.paidAt = null
      }
    }

    // Update loan
    const loan = await prisma.loan.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(serializeLoan(loan))
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