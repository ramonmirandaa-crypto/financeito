export type ToastMethod = (
  title: string,
  message?: string,
  options?: { duration?: number; dismissible?: boolean }
) => void

export interface ToastLike {
  success: ToastMethod
  error: ToastMethod
  warning: ToastMethod
}

interface CreateHandleConnectOptions {
  toast: ToastLike
  onAfterSync?: () => Promise<void> | void
}

export function createHandleConnect({ toast, onAfterSync }: CreateHandleConnectOptions) {
  return async function handleConnect() {
    try {
      const response = await fetch('/api/pluggy/link-token', { method: 'POST' })
      if (response.status === 401) {
        window.location.href = '/login'
        return
      }

      if (!response.ok) {
        let message = 'Não foi possível iniciar a conexão bancária. Verifique a configuração das variáveis do Pluggy.'
        try {
          const data = await response.json()
          if (data?.error) {
            message = data.error
          }
        } catch (parseError) {
          console.error('Falha ao interpretar resposta de erro (link-token):', parseError)
        }
        toast.error('Erro na conexão', message, { duration: 5000 })
        return
      }

      const json = await response.json()
      const connectToken = json.connectToken || json.linkToken

      if (!connectToken) {
        toast.error(
          'Erro na conexão',
          'Token de conexão não recebido. Tente novamente mais tarde.',
          { duration: 5000 }
        )
        return
      }

      const pluggyConnect = (window as any).PluggyConnect

      if (!pluggyConnect) {
        toast.warning(
          'SDK ainda não está pronto',
          'Aguarde alguns segundos enquanto carregamos o SDK de conexão bancária.'
        )
        return
      }

      const connect = new pluggyConnect({ connectToken })

      connect.onSuccess(async (item: any) => {
        try {
          const resp = await fetch('/api/pluggy/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: item.id }),
          })

          if (resp.status === 401) {
            window.location.href = '/login'
            return
          }

          if (!resp.ok) {
            let syncMessage = 'Não foi possível sincronizar suas transações. Verifique a configuração da integração.'
            try {
              const data = await resp.json()
              if (data?.error) {
                syncMessage = data.error
              }
            } catch (parseError) {
              console.error('Falha ao interpretar resposta de erro (sync):', parseError)
            }
            throw new Error(syncMessage)
          }

          await onAfterSync?.()

          toast.success(
            'Conta conectada com sucesso!',
            'Suas transações bancárias foram sincronizadas e já estão disponíveis.',
            { duration: 4000 }
          )
        } catch (error) {
          console.error('Erro ao sincronizar conta Pluggy:', error)
          const description =
            error instanceof Error && error.message
              ? error.message
              : 'Não foi possível sincronizar suas transações. Tente novamente.'
          toast.error('Erro na sincronização', description, { duration: 5000 })
        }
      })

      connect.onError?.((error: any) => {
        console.error('Pluggy Connect error:', error)
        toast.error(
          'Erro na conexão',
          'Ocorreu um erro durante a conexão. Tente novamente em instantes.',
          { duration: 5000 }
        )
      })

      connect.init()
    } catch (error) {
      console.error('Erro ao iniciar conexão Pluggy:', error)
      const description =
        error instanceof Error && error.message
          ? error.message
          : 'Não foi possível iniciar a conexão bancária. Tente novamente em instantes.'
      toast.error('Erro na conexão', description, { duration: 5000 })
    }
  }
}
