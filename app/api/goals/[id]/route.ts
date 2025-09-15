import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = params.id
    const data = await request.json()

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Meta não encontrada' }, { status: 404 })
    }

    // Update goal
    const goal = await prisma.goal.update({
      where: { id },
      data: {
        ...data,
        targetAmount: data.targetAmount ? Number(data.targetAmount) : undefined,
        currentAmount: data.currentAmount ? Number(data.currentAmount) : undefined,
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
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = params.id

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: session.user.id }
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