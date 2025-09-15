import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = params.id
    const data = await request.json()
    const { name, totalAmount, currency, period, startDate, endDate, items } = data

    let totalAmountNumber: number | undefined
    if (totalAmount !== undefined) {
      totalAmountNumber = Number(totalAmount)
      if (Number.isNaN(totalAmountNumber)) {
        return NextResponse.json({ error: 'Campo totalAmount inválido' }, { status: 400 })
      }
    }

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemAmount = Number(item.amount)
        if (Number.isNaN(itemAmount)) {
          return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
        }
        if (item.spent !== undefined) {
          const itemSpent = Number(item.spent)
          if (Number.isNaN(itemSpent)) {
            return NextResponse.json({ error: 'Campo spent inválido' }, { status: 400 })
          }
        }
      }
    }

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId },
      include: { items: true }
    })

    if (!existingBudget) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    let parsedStartDate: Date | undefined
    if (startDate !== undefined) {
      const startValue = new Date(startDate)
      if (Number.isNaN(startValue.getTime())) {
        return NextResponse.json({ error: 'Campo startDate inválido' }, { status: 400 })
      }
      parsedStartDate = startValue
    }

    let parsedEndDate: Date | undefined
    if (endDate !== undefined) {
      const endValue = new Date(endDate)
      if (Number.isNaN(endValue.getTime())) {
        return NextResponse.json({ error: 'Campo endDate inválido' }, { status: 400 })
      }
      parsedEndDate = endValue
    }

    const startForValidation = parsedStartDate ?? existingBudget.startDate
    const endForValidation = parsedEndDate ?? existingBudget.endDate

    if (startForValidation && endForValidation && endForValidation < startForValidation) {
      return NextResponse.json({ error: 'A data de término deve ser posterior à data de início' }, { status: 400 })
    }

    // Update budget and items in transaction
    const budget = await prisma.$transaction(async (tx) => {
      // Update budget
      const updatedBudget = await tx.budget.update({
        where: { id },
        data: {
          name: name ?? existingBudget.name,
          totalAmount: totalAmountNumber ?? existingBudget.totalAmount,
          currency: currency ?? existingBudget.currency,
          period: period ?? existingBudget.period,
          startDate: parsedStartDate ?? existingBudget.startDate,
          endDate: parsedEndDate ?? existingBudget.endDate
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
              name: item.name ?? item.category,
              amount: Number(item.amount),
              spent: Number(item.spent || 0),
              category: item.category,
              currency: item.currency || currency || existingBudget.currency
            }))
          })
        }
      }

      // Return updated budget with items
      return await tx.budget.findUnique({
        where: { id },
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
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const id = params.id

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: { id, userId }
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