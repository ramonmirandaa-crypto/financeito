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

    let amountNumber: number | undefined
    if (data.amount !== undefined) {
      amountNumber = Number(data.amount)
      if (Number.isNaN(amountNumber)) {
        return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
      }
    }

    // Verify subscription belongs to user
    const existingSubscription = await prisma.subscription.findFirst({
      where: { id, userId }
    })

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    if (Object.prototype.hasOwnProperty.call(data, 'name')) {
      updateData.name = data.name
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

    if (Object.prototype.hasOwnProperty.call(data, 'billingCycle')) {
      updateData.billingCycle = data.billingCycle
    }

    if (Object.prototype.hasOwnProperty.call(data, 'nextBilling')) {
      if (data.nextBilling) {
        updateData.nextBilling = new Date(data.nextBilling)
      } else if (data.nextBilling === null) {
        updateData.nextBilling = null
      }
    }

    if (Object.prototype.hasOwnProperty.call(data, 'category')) {
      updateData.category = data.category
    }

    if (Object.prototype.hasOwnProperty.call(data, 'autoRenew')) {
      updateData.autoRenew = data.autoRenew
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData
    })

    // Convert Decimal to number for JSON serialization
    const formattedSubscription = {
      ...subscription,
      amount: Number(subscription.amount)
    }

    return NextResponse.json(formattedSubscription)
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error)
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

    // Verify subscription belongs to user
    const existingSubscription = await prisma.subscription.findFirst({
      where: { id, userId }
    })

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Delete subscription
    await prisma.subscription.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}