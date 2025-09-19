import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'
import { serializeSubscription } from '@/lib/prisma-serializers'

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

    return NextResponse.json(subscriptions.map(serializeSubscription))
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

    await ensureUser(userId)

    const amountNumber = Number(amount)
    if (Number.isNaN(amountNumber)) {
      return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
    }

    const parsedNextBilling = new Date(nextBilling)
    if (Number.isNaN(parsedNextBilling.getTime())) {
      return NextResponse.json({ error: 'Campo nextBilling inválido' }, { status: 400 })
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
        nextBilling: parsedNextBilling,
        category,
        autoRenew: autoRenew ?? true
      }
    })

    return NextResponse.json(serializeSubscription(subscription), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar assinatura:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}