import { NextRequest, NextResponse } from 'next/server'
import {
  ConfigurationError,
  listAccounts,
  listTransactions,
  listCreditCards,
  listCreditCardTransactions,
  listInvestments,
  listInvestmentTransactions,
  listLoans,
  listLoanTransactions,
} from '@/lib/pluggy'
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

    const decimalOrNull = (value: unknown) => {
      if (value === null || value === undefined) return null
      if (value instanceof Prisma.Decimal) return value
      if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed) return null
        const numeric = Number(trimmed)
        if (Number.isNaN(numeric)) return null
        return new Prisma.Decimal(trimmed)
      }
      if (typeof value === 'number') {
        if (!Number.isFinite(value)) return null
        return new Prisma.Decimal(value)
      }
      return null
    }

    const toDateOrNull = (value: unknown) => {
      if (!value) return null
      const date = new Date(value as any)
      return Number.isNaN(date.getTime()) ? null : date
    }

    const toId = (value: unknown) => {
      if (value === null || value === undefined) return null
      return String(value)
    }

    const creditCardIds: string[] = []
    try {
      const ccResp = await listCreditCards({ itemId, pageSize: 500 })
      const creditCards = ccResp.results || ccResp
      for (const cc of creditCards) {
        const providerResourceId = toId(cc.id ?? cc.creditCardId ?? cc.externalId)
        if (!providerResourceId) continue
        creditCardIds.push(providerResourceId)
        const baseData = {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: 'credit_card',
          providerResourceId,
          accountId: cc.accountId ?? null,
          name: cc.name || cc.displayName || cc.number || null,
          category: cc.brand || cc.paymentNetwork || cc.type || null,
          currency: cc.currencyCode || cc.currency || 'BRL',
          amount: decimalOrNull(cc.availableCredit ?? cc.creditLimit ?? cc.limit),
          balance: decimalOrNull(cc.balance ?? cc.currentBalance ?? cc.outstandingBalance),
          dueDate: toDateOrNull(cc.dueDate ?? cc.nextDueDate ?? cc.dueDay),
          dataEnc: encryptJSON(cc),
        }
        await prisma.pluggyResource.upsert({
          where: {
            provider_resourceType_providerResourceId: {
              provider: 'pluggy',
              resourceType: 'credit_card',
              providerResourceId,
            },
          },
          update: baseData,
          create: baseData,
        })

        try {
          const ccTxResp = await listCreditCardTransactions({ creditCardId: providerResourceId, pageSize: 500 })
          const ccTransactions = ccTxResp.results || ccTxResp
          for (const ccTx of ccTransactions) {
            const txId = toId(ccTx.id ?? ccTx.transactionId ?? ccTx.externalId)
            if (!txId) continue
            creditCardIds.push(txId)
            const txData = {
              userId,
              provider: 'pluggy',
              itemId,
              resourceType: 'credit_card_transaction',
              providerResourceId: txId,
              accountId: cc.accountId ?? null,
              name: ccTx.description || ccTx.merchant || null,
              category: ccTx.category || ccTx.type || null,
              currency: ccTx.currencyCode || ccTx.currency || 'BRL',
              amount: decimalOrNull(ccTx.amount ?? ccTx.value),
              date: toDateOrNull(ccTx.date ?? ccTx.postingDate ?? ccTx.time),
              dataEnc: encryptJSON({ ...ccTx, creditCardId: providerResourceId }),
            }
            await prisma.pluggyResource.upsert({
              where: {
                provider_resourceType_providerResourceId: {
                  provider: 'pluggy',
                  resourceType: 'credit_card_transaction',
                  providerResourceId: txId,
                },
              },
              update: txData,
              create: txData,
            })
          }
        } catch (error) {
          console.warn('Falha ao sincronizar transações de cartão de crédito Pluggy:', error)
        }
      }
    } catch (error) {
      console.warn('Falha ao sincronizar cartões de crédito Pluggy:', error)
    }

    if (creditCardIds.length > 0) {
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: { in: ['credit_card', 'credit_card_transaction'] },
          providerResourceId: { notIn: creditCardIds },
        },
      })
    } else {
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: { in: ['credit_card', 'credit_card_transaction'] },
        },
      })
    }

    const investmentIds: string[] = []
    try {
      const invResp = await listInvestments({ itemId, pageSize: 500 })
      const investments = invResp.results || invResp
      for (const inv of investments) {
        const providerResourceId = toId(inv.id ?? inv.investmentId ?? inv.externalId)
        if (!providerResourceId) continue
        investmentIds.push(providerResourceId)
        const baseData = {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: 'investment',
          providerResourceId,
          accountId: inv.accountId ?? null,
          name: inv.name || inv.security || inv.product || null,
          category: inv.type || inv.subtype || null,
          currency: inv.currencyCode || inv.currency || 'BRL',
          amount: decimalOrNull(inv.quantity ?? inv.units),
          balance: decimalOrNull(inv.balance ?? inv.marketValue ?? inv.value),
          dataEnc: encryptJSON(inv),
        }
        await prisma.pluggyResource.upsert({
          where: {
            provider_resourceType_providerResourceId: {
              provider: 'pluggy',
              resourceType: 'investment',
              providerResourceId,
            },
          },
          update: baseData,
          create: baseData,
        })
      }

      try {
        const invTxResp = await listInvestmentTransactions({ itemId, pageSize: 500 })
        const investmentTransactions = invTxResp.results || invTxResp
        for (const invTx of investmentTransactions) {
          const txId = toId(invTx.id ?? invTx.transactionId ?? invTx.externalId)
          if (!txId) continue
          investmentIds.push(txId)
          const txData = {
            userId,
            provider: 'pluggy',
            itemId,
            resourceType: 'investment_transaction',
            providerResourceId: txId,
            accountId: invTx.accountId ?? null,
            name: invTx.description || invTx.security || invTx.product || null,
            category: invTx.type || invTx.operationType || null,
            currency: invTx.currencyCode || invTx.currency || 'BRL',
            amount: decimalOrNull(invTx.amount ?? invTx.value),
            balance: decimalOrNull(invTx.quantity ?? invTx.units),
            date: toDateOrNull(invTx.date ?? invTx.operationDate ?? invTx.tradeDate),
            dataEnc: encryptJSON(invTx),
          }
          await prisma.pluggyResource.upsert({
            where: {
              provider_resourceType_providerResourceId: {
                provider: 'pluggy',
                resourceType: 'investment_transaction',
                providerResourceId: txId,
              },
            },
            update: txData,
            create: txData,
          })
        }
      } catch (error) {
        console.warn('Falha ao sincronizar transações de investimentos Pluggy:', error)
      }
    } catch (error) {
      console.warn('Falha ao sincronizar investimentos Pluggy:', error)
    }

    if (investmentIds.length > 0) {
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: { in: ['investment', 'investment_transaction'] },
          providerResourceId: { notIn: investmentIds },
        },
      })
    } else {
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: { in: ['investment', 'investment_transaction'] },
        },
      })
    }

    const loanIds: string[] = []
    try {
      const loanResp = await listLoans({ itemId, pageSize: 500 })
      const loans = loanResp.results || loanResp
      for (const loan of loans) {
        const providerResourceId = toId(loan.id ?? loan.loanId ?? loan.externalId)
        if (!providerResourceId) continue
        loanIds.push(providerResourceId)
        const baseData = {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: 'loan',
          providerResourceId,
          accountId: loan.accountId ?? null,
          name: loan.name || loan.product || loan.type || null,
          category: loan.subtype || loan.category || null,
          currency: loan.currencyCode || loan.currency || 'BRL',
          amount: decimalOrNull(loan.installmentAmount ?? loan.paymentAmount),
          balance: decimalOrNull(loan.balance ?? loan.remainingBalance ?? loan.principal),
          dueDate: toDateOrNull(loan.nextDueDate ?? loan.dueDate ?? loan.endDate),
          dataEnc: encryptJSON(loan),
        }
        await prisma.pluggyResource.upsert({
          where: {
            provider_resourceType_providerResourceId: {
              provider: 'pluggy',
              resourceType: 'loan',
              providerResourceId,
            },
          },
          update: baseData,
          create: baseData,
        })

        try {
          const loanTxResp = await listLoanTransactions({ loanId: providerResourceId, pageSize: 500 })
          const loanTransactions = loanTxResp.results || loanTxResp
          for (const loanTx of loanTransactions) {
            const txId = toId(loanTx.id ?? loanTx.transactionId ?? loanTx.externalId)
            if (!txId) continue
            loanIds.push(txId)
            const txData = {
              userId,
              provider: 'pluggy',
              itemId,
              resourceType: 'loan_transaction',
              providerResourceId: txId,
              accountId: loan.accountId ?? loanTx.accountId ?? null,
              name: loanTx.description || loanTx.type || null,
              category: loanTx.category || loanTx.subtype || null,
              currency: loanTx.currencyCode || loanTx.currency || 'BRL',
              amount: decimalOrNull(loanTx.amount ?? loanTx.value),
              date: toDateOrNull(loanTx.date ?? loanTx.postingDate ?? loanTx.time),
              dataEnc: encryptJSON({ ...loanTx, loanId: providerResourceId }),
            }
            await prisma.pluggyResource.upsert({
              where: {
                provider_resourceType_providerResourceId: {
                  provider: 'pluggy',
                  resourceType: 'loan_transaction',
                  providerResourceId: txId,
                },
              },
              update: txData,
              create: txData,
            })
          }
        } catch (error) {
          console.warn('Falha ao sincronizar parcelas de empréstimo Pluggy:', error)
        }
      }
    } catch (error) {
      console.warn('Falha ao sincronizar empréstimos Pluggy:', error)
    }

    if (loanIds.length > 0) {
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: { in: ['loan', 'loan_transaction'] },
          providerResourceId: { notIn: loanIds },
        },
      })
    } else {
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          itemId,
          resourceType: { in: ['loan', 'loan_transaction'] },
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
    const resources = await prisma.pluggyResource.findMany({ where: { userId: uid } })
    const resourcesWithData = resources.map((resource) => ({
      ...resource,
      data: resource.dataEnc ? decryptJSON(resource.dataEnc) : null,
    }))
    const resourcesByType = (type: string) =>
      resourcesWithData.filter((resource) => resource.resourceType === type)

    return NextResponse.json({
      accounts: accs,
      transactions: txs,
      creditCards: resourcesByType('credit_card'),
      creditCardTransactions: resourcesByType('credit_card_transaction'),
      investments: resourcesByType('investment'),
      investmentTransactions: resourcesByType('investment_transaction'),
      loans: resourcesByType('loan'),
      loanTransactions: resourcesByType('loan_transaction'),
    })
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
    if (account.provider === 'pluggy') {
      const deletionFilters = [{ accountId }]
      if (account.providerItem) {
        deletionFilters.push({ itemId: account.providerItem })
      }
      await prisma.pluggyResource.deleteMany({
        where: {
          userId,
          provider: 'pluggy',
          OR: deletionFilters,
        },
      })
    }
    await prisma.bankAccount.delete({ where: { id: accountId } })
  } catch (error) {
    console.error('Erro ao desconectar conta Pluggy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
