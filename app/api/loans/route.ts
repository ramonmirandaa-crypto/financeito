import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const loans = await prisma.loan.findMany({
      where: { userId: session.user.id },
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
    const session = await getAuthSession()
    if (!session?.user) {
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

    // Create loan
    const loan = await prisma.loan.create({
      data: {
        userId: session.user.id,
        title,
        description,
        amount: Number(amount),
        currency: currency || 'BRL',
        lenderName,
        lenderContact,
        type,
        interestRate: interestRate ? Number(interestRate) : null,
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