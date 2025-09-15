import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Convert Decimal to number for JSON serialization
    const formattedSubscriptions = subscriptions.map((subscription: any) => ({
      ...subscription,
      amount: Number(subscription.amount)
    }))

    return NextResponse.json(formattedSubscriptions)
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error)
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
    const { name, description, amount, currency, billingCycle, nextBilling, category, autoRenew } = data

    // Validate required fields
    if (!name || !amount || !billingCycle || !nextBilling) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    const amountNumber = Number(amount)
    if (Number.isNaN(amountNumber)) {
      return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        name,
        description,
        amount: amountNumber,
        currency: currency || 'BRL',
        billingCycle,
        nextBilling: new Date(nextBilling),
        category,
        autoRenew: autoRenew ?? true
      }
    })

    // Convert Decimal to number for JSON serialization
    const formattedSubscription = {
      ...subscription,
      amount: Number(subscription.amount)
    }

    return NextResponse.json(formattedSubscription, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}