import { motion } from 'framer-motion'
import { LiquidButton } from './liquid-button'
import { LiquidCard } from './liquid-card'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  actionText?: string
  onAction?: () => void
  actionHref?: string
  className?: string
  disabled?: boolean
}

export function EmptyState({
  icon = "📋",
  title,
  description,
  actionText,
  onAction,
  actionHref,
  className = "",
  disabled = false
}: EmptyStateProps) {
  return (
    <motion.div
      className={`text-center py-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="text-6xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-xl font-semibold text-slate-300 mb-2">{title}</h3>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">{description}</p>
      {(actionText && (onAction || actionHref)) && (
        <LiquidButton
          onClick={onAction}
          variant="primary"
          className={actionHref ? "inline-block" : ""}
          disabled={disabled}
        >
          {actionHref ? (
            <a href={actionHref}>{actionText}</a>
          ) : (
            actionText
          )}
        </LiquidButton>
      )}
    </motion.div>
  )
}

// Estados vazios específicos para cada seção
interface EmptyConnectStateProps {
  onConnect?: () => void
  disabled?: boolean
}

export function EmptyTransactions({ onConnect, disabled }: EmptyConnectStateProps) {
  return (
    <EmptyState
      icon="💳"
      title="Nenhuma transação encontrada"
      description="Conecte suas contas bancárias para ver suas transações automaticamente ou adicione transações manualmente."
      actionText="Conectar Conta"
      onAction={onConnect}
      disabled={disabled}
    />
  )
}

export function EmptyAccounts({ onConnect, disabled }: EmptyConnectStateProps) {
  return (
    <EmptyState
      icon="🏦"
      title="Nenhuma conta conectada"
      description="Conecte suas contas bancárias para começar a acompanhar seu saldo e transações em tempo real."
      actionText="Conectar Primeira Conta"
      onAction={onConnect}
      disabled={disabled}
    />
  )
}

export function EmptyBudgets() {
  return (
    <EmptyState
      icon="📊"
      title="Nenhum orçamento criado"
      description="Crie orçamentos para diferentes categorias e acompanhe seus gastos mensais de forma organizada."
      actionText="Criar Primeiro Orçamento"
      actionHref="/budget/new"
    />
  )
}

export function EmptyGoals() {
  return (
    <EmptyState
      icon="🎯"
      title="Nenhuma meta definida"
      description="Defina metas financeiras para seus objetivos: emergência, viagem, casa própria ou qualquer sonho!"
      actionText="Definir Primeira Meta"
      actionHref="/goals/new"
    />
  )
}

export function EmptySubscriptions() {
  return (
    <EmptyState
      icon="📱"
      title="Nenhuma assinatura cadastrada"
      description="Adicione suas assinaturas recorrentes para ter controle total dos seus gastos mensais."
      actionText="Adicionar Assinatura"
      actionHref="/subscriptions/new"
    />
  )
}

export function EmptyLoans() {
  return (
    <EmptyState
      icon="🤝"
      title="Nenhum empréstimo cadastrado"
      description="Registre empréstimos feitos ou recebidos para acompanhar prazos e valores pendentes."
      actionText="Registrar Empréstimo"
      actionHref="/loans/new"
    />
  )
}

export function EmptyUpcomingPayments() {
  return (
    <div className="text-center py-4 text-slate-400">
      <span className="text-green-400">✅</span>
      <span className="ml-2">Nenhum vencimento nos próximos 7 dias</span>
    </div>
  )
}