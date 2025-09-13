import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' }
    })

    // Convert Decimal to number for JSON serialization
    const formattedGoals = goals.map((goal: any) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    }))

    return NextResponse.json(formattedGoals)
  } catch (error) {
    console.error('Erro ao buscar metas:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const data = await request.json()
    const { title, description, targetAmount, currency, targetDate, category, priority } = data

    // Validate required fields
    if (!title || !targetAmount || !targetDate) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    // Create goal
    const goal = await prisma.goal.create({
      data: {
        userId: payload.userId,
        title,
        description,
        targetAmount: Number(targetAmount),
        currency: currency || 'BRL',
        targetDate: new Date(targetDate),
        category,
        priority: priority || 'medium'
      }
    })

    // Convert Decimal to number for JSON serialization
    const formattedGoal = {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount)
    }

    return NextResponse.json(formattedGoal, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar meta:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}