import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })

    // Convert Decimal to number for JSON serialization
    const formattedLoans = loans.map((loan: any) => ({
      ...loan,
      amount: Number(loan.amount),
      interestRate: loan.interestRate ? Number(loan.interestRate) : null
    }))

    return NextResponse.json(formattedLoans)
  } catch (error) {
    console.error('Erro ao buscar empréstimos:', error)
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
    const { title, description, amount, currency, lenderName, lenderContact, type, interestRate, dueDate } = data

    // Validate required fields
    if (!title || !amount || !lenderName || !type) {
      return NextResponse.json({ error: 'Campos obrigatórios não preenchidos' }, { status: 400 })
    }

    // Validate type
    if (!['lent', 'borrowed'].includes(type)) {
      return NextResponse.json({ error: 'Tipo de empréstimo inválido' }, { status: 400 })
    }

    const amountNumber = Number(amount)
    if (Number.isNaN(amountNumber)) {
      return NextResponse.json({ error: 'Campo amount inválido' }, { status: 400 })
    }

    let interestRateNumber: number | null = null
    if (interestRate !== undefined && interestRate !== null) {
      interestRateNumber = Number(interestRate)
      if (Number.isNaN(interestRateNumber)) {
        return NextResponse.json({ error: 'Campo interestRate inválido' }, { status: 400 })
      }
    }

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        userId,
        title,
        description,
        amount: amountNumber,
        currency: currency || 'BRL',
        lenderName,
        lenderContact,
        type,
        interestRate: interestRateNumber,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    })

    // Convert Decimal to number for JSON serialization
    const formattedLoan = {
      ...loan,
      amount: Number(loan.amount),
      interestRate: loan.interestRate ? Number(loan.interestRate) : null
    }

    return NextResponse.json(formattedLoan, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar empréstimo:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}