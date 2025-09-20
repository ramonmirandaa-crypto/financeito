import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Planos e Cobrança | Financeito',
}

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planos &amp; Cobrança</CardTitle>
          <CardDescription>Gerencie sua assinatura do Financeito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Consulte histórico de pagamentos, método de cobrança e atualize o plano quando disponível.
          </p>
          <Button asChild variant="outline">
            <Link href="/subscriptions">Ver minhas assinaturas</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
