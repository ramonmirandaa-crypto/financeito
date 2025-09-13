import { NextRequest, NextResponse } from 'next/server'
import { listAccounts, listTransactions } from '@/lib/pluggy'
import { encryptJSON, decryptJSON } from '@/lib/crypto'
import { getUserFromRequest } from '@/lib/apiAuth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { itemId } = await req.json()
  if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

  const accResp = await listAccounts({ itemId })
  const accounts = accResp.results || accResp
  for (const acc of accounts) {
    await prisma.account.upsert({
      where: { id: acc.id },
      update: {
        userId: user.id,
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
        userId: user.id,
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

  const txResp = await listTransactions({ itemId, pageSize: 500 })
  const txs = txResp.results || txResp
  for (const tx of txs) {
    await prisma.transaction.upsert({
      where: { id: tx.id },
      update: {
        accountId: tx.accountId,
        userId: user.id,
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
        userId: user.id,
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
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const accounts = await prisma.account.findMany({ where: { userId: user.id } })
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
    take: 50,
  })
  const accs = accounts.map((a) => ({
    ...a,
    data: a.dataEnc ? decryptJSON(a.dataEnc) : null,
  }))
  const txs = transactions.map((t) => ({
    ...t,
    raw: t.rawEnc ? decryptJSON(t.rawEnc) : null,
  }))
  return NextResponse.json({ accounts: accs, transactions: txs })
}
