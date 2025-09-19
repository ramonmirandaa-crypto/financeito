import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'
import { serializeBudget } from '@/lib/prisma-serializers'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: { userId },
      include: {
        items: {
          select: {
            id: true,
            budgetId: true,
            accountId: true,
            name: true,
            category: true,
            amount: true,
            spent: true,
            currency: true,
            createdAt: true,
            updatedAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(budgets.map(serializeBudget))
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)
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
    const { name, totalAmount, currency, period, startDate, endDate, items } = data

    // Validate required fields
    if (!name || !totalAmount || !period || !startDate || !endDate) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    await ensureUser(userId)

    const totalAmountNumber = Number(totalAmount)
    if (Number.isNaN(totalAmountNumber)) {
      return NextResponse.json({ error: 'Campo totalAmount inválido' }, { status: 400 })
    }

    const parsedStartDate = new Date(startDate)
    if (Number.isNaN(parsedStartDate.getTime())) {
      return NextResponse.json({ error: 'Campo startDate inválido' }, { status: 400 })
    }

    const parsedEndDate = new Date(endDate)
    if (Number.isNaN(parsedEndDate.getTime())) {
      return NextResponse.json({ error: 'Campo endDate inválido' }, { status: 400 })
    }

    if (parsedEndDate < parsedStartDate) {
      return NextResponse.json({ error: 'A data de término deve ser posterior à data de início' }, { status: 400 })
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemAmount = Number(item.amount)
        if (Number.isNaN(itemAmount)) {
          return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
        }
      }
    }

    // Create budget
    const budget = await prisma.budget.create({
      data: {
        userId,
        name,
        totalAmount: totalAmountNumber,
        currency: currency || 'BRL',
        period,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        isActive: true,
        items: {
          create: items?.map((item: any) => ({
            name: item.name ?? item.category,
            category: item.category,
            amount: Number(item.amount),
            currency: item.currency || currency || 'BRL'
          })) || []
        }
      },
      include: {
        items: {
          select: {
            id: true,
            budgetId: true,
            accountId: true,
            name: true,
            category: true,
            amount: true,
            spent: true,
            currency: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    return NextResponse.json(serializeBudget(budget), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar orçamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}