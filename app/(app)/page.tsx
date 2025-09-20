"use client"

import Link from 'next/link'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'

export default function Home() {
  return (
    <div className="mt-24 flex justify-center">
      <LiquidCard variant="hoverable" className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-gradient-primary glow-primary">
          Financeito
        </h1>
        <p className="opacity-80">Seu centro de finanças pessoais com Open Finance.</p>
        <Link href="/dashboard">
          <LiquidButton variant="primary" className="mt-6">
            Acessar Dashboard
          </LiquidButton>
        </Link>
      </LiquidCard>
    </div>
  )
}
