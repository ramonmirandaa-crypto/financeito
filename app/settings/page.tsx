import type { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DeployButton } from '@/components/settings/deploy-button'

export const metadata: Metadata = {
  title: 'Configurações | Financeito',
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>Personalize como o Financeito funciona para você.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Em breve você poderá definir preferências gerais, idioma e integrações.
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Voltar ao dashboard</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Atualização do servidor</CardTitle>
          <CardDescription>
            Execute um deploy remoto para aplicar alterações commitadas no repositório e reiniciar os contêineres.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Este recurso está disponível apenas para administradores autorizados. Configure a variável{' '}
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">DEPLOY_ALLOWED_EMAILS</code>{' '}
            com os e-mails que podem acionar o processo.
          </p>
          <DeployButton />
        </CardContent>
      </Card>
    </div>
  )
}
