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

    let targetAmountNumber: number | undefined
    if (data.targetAmount !== undefined) {
      targetAmountNumber = Number(data.targetAmount)
      if (Number.isNaN(targetAmountNumber)) {
        return NextResponse.json({ error: 'Campo targetAmount inválido' }, { status: 400 })
      }
    }

    let currentAmountNumber: number | undefined
    if (data.currentAmount !== undefined) {
      currentAmountNumber = Number(data.currentAmount)
      if (Number.isNaN(currentAmountNumber)) {
        return NextResponse.json({ error: 'Campo currentAmount inválido' }, { status: 400 })
      }
    }

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 })
    }

    // Update goal
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        targetAmount: targetAmountNumber,
        currentAmount: currentAmountNumber,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined
      }
    })

    // Convert Decimal to number for JSON serialization
    const formattedGoal = {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    }

    return NextResponse.json(formattedGoal)
  } catch (error) {
    console.error('Erro ao atualizar meta:', error)
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

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId }
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 })
    }

    // Delete goal
    await prisma.goal.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar meta:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}