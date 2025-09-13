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

    // Verify subscription belongs to user
    const existingSubscription = await prisma.subscription.findFirst({
      where: { id, userId: payload.userId }
    })

    if (!existingSubscription) {
      return NextResponse.json({ error: 'Assinatura não encontrada' }, { status: 404 })
    }

    // Update subscription
    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        ...data,
        amount: data.amount ? Number(data.amount) : undefined,
        nextBilling: data.nextBilling ? new Date(data.nextBilling) : undefined
      }
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
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    const id = params.id

    // Verify subscription belongs to user
    const existingSubscription = await prisma.subscription.findFirst({
      where: { id, userId: payload.userId }
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