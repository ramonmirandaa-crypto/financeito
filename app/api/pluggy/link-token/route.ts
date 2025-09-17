import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationError, createConnectToken } from '@/lib/pluggy'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
  const { userId } = auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const data = await createConnectToken({})
    return NextResponse.json(data)
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error('Falha de configuração do Pluggy (link-token):', error)
      return NextResponse.json({ error: error.message }, { status: 503 })
    }
    console.error('Erro ao criar connect token do Pluggy:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
