'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type DeployResult = {
  success: boolean
  error?: string
  stdout?: string
  stderr?: string
}

export function DeployButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<DeployResult | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const handleDeploy = async () => {
    setIsLoading(true)
    setLastResult(null)

    try {
      const response = await fetch('/api/admin/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = (await response.json()) as DeployResult

      setLastResult({ ...data, success: response.ok && data.success })
      setLastUpdatedAt(new Date())
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      setLastResult({ success: false, error: message })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStatus = () => {
    if (!lastResult) {
      return null
    }

    if (lastResult.success) {
      return (
        <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm">
          <p className="font-semibold text-green-500">Deploy executado com sucesso.</p>
          {lastUpdatedAt ? (
            <p className="text-xs text-muted-foreground">
              Última execução em {lastUpdatedAt.toLocaleString('pt-BR')}
            </p>
          ) : null}
          {lastResult.stdout ? (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground">
              {lastResult.stdout.trim()}
            </pre>
          ) : null}
          {lastResult.stderr ? (
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground">
              {lastResult.stderr.trim()}
            </pre>
          ) : null}
        </div>
      )
    }

    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
        <p className="font-semibold text-destructive">Falha ao executar o deploy.</p>
        {lastUpdatedAt ? (
          <p className="text-xs text-muted-foreground">
            Tentativa em {lastUpdatedAt.toLocaleString('pt-BR')}
          </p>
        ) : null}
        {lastResult.error ? (
          <p className="mt-2 whitespace-pre-wrap break-words text-xs text-foreground">
            {lastResult.error}
          </p>
        ) : null}
        {lastResult.stdout ? (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground">
            {lastResult.stdout.trim()}
          </pre>
        ) : null}
        {lastResult.stderr ? (
          <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground">
            {lastResult.stderr.trim()}
          </pre>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleDeploy} disabled={isLoading}>
        {isLoading ? 'Atualizando servidor…' : 'Atualizar servidor agora'}
      </Button>
      {isLoading ? <p className="text-xs text-muted-foreground">Executando comandos no servidor…</p> : null}
      {renderStatus()}
    </div>
  )
}
