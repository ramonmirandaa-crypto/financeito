import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Ajuda e Suporte | Financeito',
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ajuda &amp; Suporte</CardTitle>
          <CardDescription>Encontre recursos para tirar dúvidas sobre o Financeito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Consulte nossa base de conhecimento, envie um e-mail para suporte ou acesse a comunidade.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="mailto:suporte@financeito.app">Contactar suporte</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard">Voltar ao dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
