'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LiquidInput } from '@/components/ui/liquid-input'

interface Subscription {
  id?: string
  name: string
  description?: string
  amount: number
  currency: string
  billingCycle: string
  nextBilling: string
  category?: string
  autoRenew: boolean
}

interface SubscriptionFormProps {
  subscription?: Subscription
  onSubmit: (subscription: Subscription) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function SubscriptionForm({ subscription, onSubmit, onCancel, loading }: SubscriptionFormProps) {
  const [formData, setFormData] = useState<Subscription>({
    name: subscription?.name || '',
    description: subscription?.description || '',
    amount: subscription?.amount || 0,
    currency: subscription?.currency || 'BRL',
    billingCycle: subscription?.billingCycle || 'monthly',
    nextBilling: subscription?.nextBilling ? new Date(subscription.nextBilling).toISOString().split('T')[0] : '',
    category: subscription?.category || '',
    autoRenew: subscription?.autoRenew ?? true
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erro ao salvar assinatura:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const annualCost = formData.billingCycle === 'monthly' ? formData.amount * 12 : formData.amount

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <LiquidCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {subscription?.id ? 'Editar Assinatura' : 'Nova Assinatura'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome do Serviço *
              </label>
              <LiquidInput
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Netflix, Spotify, Adobe Creative"
                required
                className="focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descrição
              </label>
              <LiquidInput
                type="text"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Plano ou detalhes adicionais..."
                className="focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Amount and Currency */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valor *
                </label>
                <LiquidInput
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  required
                  className="focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Moeda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Billing Cycle */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Ciclo de Cobrança *
              </label>
              <select
                value={formData.billingCycle}
                onChange={(e) => setFormData(prev => ({ ...prev, billingCycle: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
                <option value="weekly">Semanal</option>
              </select>
              {formData.amount > 0 && (
                <p className="text-xs text-slate-400 mt-1">
                  Custo anual estimado: {formData.currency} {annualCost.toFixed(2)}
                </p>
              )}
            </div>

            {/* Next Billing Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Próxima Cobrança *
              </label>
              <LiquidInput
                type="date"
                value={formData.nextBilling}
                onChange={(e) => setFormData(prev => ({ ...prev, nextBilling: e.target.value }))}
                required
                className="focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Categoria
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecionar...</option>
                <option value="streaming">Streaming</option>
                <option value="software">Software</option>
                <option value="nuvem">Armazenamento/Nuvem</option>
                <option value="jogos">Jogos</option>
                <option value="musica">Música</option>
                <option value="produtividade">Produtividade</option>
                <option value="noticias">Notícias</option>
                <option value="fitness">Fitness</option>
                <option value="outros">Outros</option>
              </select>
            </div>

            {/* Auto Renew */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="autoRenew"
                checked={formData.autoRenew}
                onChange={(e) => setFormData(prev => ({ ...prev, autoRenew: e.target.checked }))}
                className="w-4 h-4 text-purple-600 bg-slate-700 border-slate-600 rounded focus:ring-purple-500"
              />
              <label htmlFor="autoRenew" className="text-sm text-slate-300">
                Renovação automática ativada
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-600">
              <LiquidButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={submitting}
                className="flex-1"
              >
                Cancelar
              </LiquidButton>
              <LiquidButton
                type="submit"
                variant="primary"
                disabled={submitting || !formData.name.trim() || !formData.nextBilling}
                className="flex-1"
                glowColor="#8b5cf6"
              >
                {submitting ? 'Salvando...' : subscription?.id ? 'Atualizar' : 'Criar Assinatura'}
              </LiquidButton>
            </div>
          </form>
        </LiquidCard>
      </motion.div>
    </div>
  )
}