import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: session.user.id },
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
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { name, description, amount, currency, billingCycle, nextBilling, category, autoRenew } = data

    // Validate required fields
    if (!name || !amount || !billingCycle || !nextBilling) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        userId: session.user.id,
        name,
        description,
        amount: Number(amount),
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