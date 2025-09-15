import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: session.user.id },
      include: {
        items: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Convert Decimal to number for JSON serialization
    const formattedBudgets = budgets.map((budget: any) => ({
      ...budget,
      totalAmount: Number(budget.totalAmount),
      items: budget.items.map((item: any) => ({
        ...item,
        amount: Number(item.amount),
        spent: Number(item.spent)
      }))
    }))

    return NextResponse.json(formattedBudgets)
  } catch (error) {
    console.error('Erro ao buscar orçamentos:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { name, totalAmount, currency, period, startDate, endDate, items } = data

    // Validate required fields
    if (!name || !totalAmount || !period || !startDate || !endDate) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const totalAmountNumber = Number(totalAmount)
    if (Number.isNaN(totalAmountNumber)) {
      return NextResponse.json({ error: 'Campo totalAmount inválido' }, { status: 400 })
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
        userId: session.user.id,
        name,
        totalAmount: totalAmountNumber,
        currency: currency || 'BRL',
        period,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
        items: {
          create: items?.map((item: any) => ({
            category: item.category,
            amount: Number(item.amount),
            currency: item.currency || currency || 'BRL'
          })) || []
        }
      },
      include: {
        items: true
      }
    })

    // Convert Decimal to number for JSON serialization
    const formattedBudget = {
      ...budget,
      totalAmount: Number(budget.totalAmount),
      items: budget.items.map((item: any) => ({
        ...item,
        amount: Number(item.amount),
        spent: Number(item.spent)
      }))
    }

    return NextResponse.json(formattedBudget, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar orçamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}