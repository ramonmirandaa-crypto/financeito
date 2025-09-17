import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { ensureUser } from '@/lib/ensure-user'

const MANUAL_ACCOUNT_PROVIDER = 'manual'
const MANUAL_ACCOUNT_ITEM = 'manual-default'
const MANUAL_ACCOUNT_NAME = 'Conta Manual Padrão'

const serializeAccount = (account: any) => ({
  id: account.id,
  provider: account.provider,
  providerItem: account.providerItem,
  name: account.name,
  currency: account.currency,
  balance: Number(account.balance ?? 0),
  mask: account.mask,
  createdAt: account.createdAt.toISOString(),
  updatedAt: account.updatedAt.toISOString(),
})

export async function POST() {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await ensureUser(userId)

    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        userId,
        provider: MANUAL_ACCOUNT_PROVIDER,
        providerItem: MANUAL_ACCOUNT_ITEM,
      },
    })

    if (existingAccount) {
      return NextResponse.json(serializeAccount(existingAccount))
    }

    const manualAccount = await prisma.bankAccount.create({
      data: {
        userId,
        provider: MANUAL_ACCOUNT_PROVIDER,
        providerItem: MANUAL_ACCOUNT_ITEM,
        name: MANUAL_ACCOUNT_NAME,
        currency: 'BRL',
        balance: new Prisma.Decimal(0),
        mask: null,
      },
    })

    return NextResponse.json(serializeAccount(manualAccount), { status: 201 })
  } catch (error) {
    console.error('Erro ao criar conta manual:', error)
    return NextResponse.json(
      { error: 'Não foi possível criar uma conta manual padrão.' },
      { status: 500 }
    )
  }
}
