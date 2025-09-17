import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationError, listAccounts, listTransactions } from '@/lib/pluggy'
import { EncryptionConfigError, encryptJSON, decryptJSON } from '@/lib/crypto'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { ensureUser } from '@/lib/ensure-user'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { itemId } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  try {
    await ensureUser(userId)

    const accResp = await listAccounts({ itemId })
    const accounts = accResp.results || accResp
    for (const acc of accounts) {
      await prisma.bankAccount.upsert({
        where: { id: acc.id },
        update: {
          userId,
          provider: 'pluggy',
          providerItem: itemId,
          name: acc.name,
          currency: acc.currencyCode || acc.currency || 'BRL',
          balance: new Prisma.Decimal(acc.balance ?? 0),
          mask: acc.number ? String(acc.number).slice(-4) : null,
          dataEnc: encryptJSON(acc),
        },
        create: {
          id: acc.id,
          userId,
          provider: 'pluggy',
          providerItem: itemId,
          name: acc.name,
          currency: acc.currencyCode || acc.currency || 'BRL',
          balance: new Prisma.Decimal(acc.balance ?? 0),
          mask: acc.number ? String(acc.number).slice(-4) : null,
          dataEnc: encryptJSON(acc),
        },
      })
    }

    const firstResp = await listTransactions({ itemId, pageSize: 500 })
    const allTxs = [...(firstResp.results || firstResp)]
    let nextPage = firstResp.nextPage || firstResp.results?.nextPage
    while (nextPage) {
      const resp = await listTransactions({ itemId, pageSize: 500, page: nextPage })
      allTxs.push(...(resp.results || resp))
      nextPage = resp.nextPage || resp.results?.nextPage
    }

    for (const tx of allTxs) {
      await prisma.transaction.upsert({
        where: { id: tx.id },
        update: {
          accountId: tx.accountId,
          userId,
          description: tx.description,
          category: tx.category || null,
          currency: tx.currencyCode || tx.currency || 'BRL',
          amount: new Prisma.Decimal(tx.amount || 0),
          date: new Date(tx.date),
          rawEnc: encryptJSON(tx),
        },
        create: {
          id: tx.id,
          accountId: tx.accountId,
          userId,
          description: tx.description,
          category: tx.category || null,
          currency: tx.currencyCode || tx.currency || 'BRL',
          amount: new Prisma.Decimal(tx.amount || 0),
          date: new Date(tx.date),
          rawEnc: encryptJSON(tx),
        },
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof ConfigurationError || error instanceof EncryptionConfigError) {
      console.error('Falha de configuração ao sincronizar Pluggy:', error)
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Erro inesperado ao sincronizar Pluggy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

const parseManualMetadata = (value: string | null | undefined) => {
  if (!value) return null
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch (error) {
    console.warn('Falha ao interpretar metadata de conta manual:', error)
    return null
  }
}

export async function GET(req: NextRequest) {
  const { userId: uid } = auth()
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const accounts = await prisma.bankAccount.findMany({ where: { userId: uid } })
    const transactions = await prisma.transaction.findMany({
      where: { userId: uid },
      orderBy: { date: 'desc' },
      take: 50,
    })
    const accs = accounts.map((a) => ({
      ...a,
      data:
        a.provider === 'manual'
          ? parseManualMetadata(a.dataEnc)
          : a.dataEnc
            ? decryptJSON(a.dataEnc)
            : null,
    }))
    const txs = transactions.map((t) => ({
      ...t,
      raw: t.rawEnc ? decryptJSON(t.rawEnc) : null,
    }))
    return NextResponse.json({ accounts: accs, transactions: txs })
  } catch (error) {
    if (error instanceof EncryptionConfigError) {
      console.error('Falha de configuração ao ler dados Pluggy:', error)
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Erro inesperado ao listar dados Pluggy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')

  if (!accountId) {
    return NextResponse.json({ error: 'accountId required' }, { status: 400 })
  }

  await ensureUser(userId)

  const account = await prisma.bankAccount.findUnique({ where: { id: accountId } })

  if (!account || account.userId !== userId) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 })
  }

  try {
    await prisma.transaction.deleteMany({ where: { accountId, userId } })
    await prisma.budgetItem.updateMany({
      where: { accountId, budget: { userId } },
      data: { accountId: null },
    })
    await prisma.bankAccount.delete({ where: { id: accountId } })
  } catch (error) {
    console.error('Erro ao desconectar conta Pluggy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
