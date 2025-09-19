import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'
import { serializeGoal } from '@/lib/prisma-serializers'

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

    const updateData: Record<string, any> = {}

    if (Object.prototype.hasOwnProperty.call(data, 'title')) {
      updateData.title = data.title
    }

    if (Object.prototype.hasOwnProperty.call(data, 'description')) {
      updateData.description = data.description
    }

    if (Object.prototype.hasOwnProperty.call(data, 'targetAmount')) {
      if (data.targetAmount !== undefined) {
        updateData.targetAmount = targetAmountNumber
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'currentAmount')) {
      if (data.currentAmount !== undefined) {
        updateData.currentAmount = currentAmountNumber
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'currency')) {
      updateData.currency = data.currency
    }

    if (Object.prototype.hasOwnProperty.call(data, 'targetDate')) {
      if (data.targetDate) {
        updateData.targetDate = new Date(data.targetDate)
      } else if (data.targetDate === null) {
        updateData.targetDate = null
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'category')) {
      updateData.category = data.category
    }

    if (Object.prototype.hasOwnProperty.call(data, 'priority')) {
      updateData.priority = data.priority
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isCompleted')) {
      updateData.isCompleted = data.isCompleted
    }

    // Update goal
    const goal = await prisma.goal.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(serializeGoal(goal))
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