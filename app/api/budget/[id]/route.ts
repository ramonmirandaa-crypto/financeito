import { NextRequest, NextResponse } from 'next/server'
import { verifyJWT } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const id = params.id
    const data = await request.json()
    const { name, totalAmount, items } = data

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId: payload.userId },
      include: { items: true }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    // Update budget and items in transaction
    const budget = await prisma.$transaction(async (tx) => {
      // Update budget
      const updatedBudget = await tx.budget.update({
        where: { id },
        data: {
          name: name || existingBudget.name,
          totalAmount: totalAmount ? Number(totalAmount) : existingBudget.totalAmount
        }
      })

      // Update items if provided
      if (items && Array.isArray(items)) {
        // Delete existing items
        await tx.budgetItem.deleteMany({
          where: { budgetId: id }
        })

        // Create new items
        if (items.length > 0) {
          await tx.budgetItem.createMany({
            data: items.map((item: any) => ({
              budgetId: id,
              name: item.name,
              amount: Number(item.amount),
              spent: Number(item.spent || 0),
              category: item.category
            }))
          })
        }
      }

      // Return updated budget with items
      return await tx.budget.findUnique({
        where: { id },
        include: { items: true }
      })
    })

    // Convert Decimal to number for JSON serialization
    const formattedBudget = {
      ...budget,
      totalAmount: Number(budget!.totalAmount),
      items: budget!.items.map((item: any) => ({
        ...item,
        amount: Number(item.amount),
        spent: Number(item.spent)
      }))
    }

    return NextResponse.json(formattedBudget)
  } catch (error) {
    console.error('Erro ao atualizar orçamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const id = params.id

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId: payload.userId }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    // Delete budget and items in transaction
    await prisma.$transaction(async (tx) => {
      // Delete budget items first (due to foreign key constraint)
      await tx.budgetItem.deleteMany({
        where: { budgetId: id }
      })

      // Delete budget
      await tx.budget.delete({
        where: { id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar orçamento:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}