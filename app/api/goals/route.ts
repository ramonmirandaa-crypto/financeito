import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'
import { serializeGoal } from '@/lib/prisma-serializers'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(goals.map(serializeGoal))
  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const {
      title,
      description,
      targetAmount,
      currentAmount,
      currency,
      targetDate,
      category,
      priority
    } = data

    // Validate required fields
    if (!title || !targetAmount || !targetDate) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    await ensureUser(userId)

    const targetAmountNumber = Number(targetAmount)
    if (Number.isNaN(targetAmountNumber)) {
      return NextResponse.json({ error: 'Campo targetAmount inválido' }, { status: 400 })
    }

    const currentAmountNumber = currentAmount !== undefined ? Number(currentAmount) : 0
    if (Number.isNaN(currentAmountNumber)) {
      return NextResponse.json({ error: 'Campo currentAmount inválido' }, { status: 400 })
    }

    const parsedTargetDate = new Date(targetDate)
    if (Number.isNaN(parsedTargetDate.getTime())) {
      return NextResponse.json({ error: 'Campo targetDate inválido' }, { status: 400 })
    }

    // Create goal
    const goal = await prisma.goal.create({
      data: {
        userId,
        title,
        description,
        targetAmount: targetAmountNumber,
        currentAmount: currentAmountNumber,
        currency: currency || 'BRL',
        targetDate: parsedTargetDate,
        category,
        priority: priority || 'medium'
      }
    })

    return NextResponse.json(serializeGoal(goal), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar meta:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}