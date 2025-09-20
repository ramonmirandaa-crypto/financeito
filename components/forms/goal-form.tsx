'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LiquidInput } from '@/components/ui/liquid-input'

export interface GoalFormData {
  id?: string
  title: string
  description?: string
  targetAmount: number
  currentAmount?: number
  currency: string
  targetDate: string
  category?: string
  priority: string
  isCompleted?: boolean
}

interface GoalFormProps {
  goal?: GoalFormData
  onSubmit: (goal: GoalFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function GoalForm({ goal, onSubmit, onCancel, loading }: GoalFormProps) {
  const [formData, setFormData] = useState<GoalFormData>({
    title: goal?.title || '',
    description: goal?.description || '',
    targetAmount: goal?.targetAmount || 0,
    currentAmount: goal?.currentAmount || 0,
    currency: goal?.currency || 'BRL',
    targetDate: goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    category: goal?.category || '',
    priority: goal?.priority || 'medium',
    isCompleted: goal?.isCompleted || false
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const progressPercentage = formData.targetAmount > 0 ? (formData.currentAmount! / formData.targetAmount) * 100 : 0

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
                {goal?.id ? 'Editar Meta' : 'Nova Meta'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Goal Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Título da Meta *
              </label>
              <LiquidInput
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Comprar um carro"
                required
                className="focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Descreva sua meta..."
                rows={3}
              />
            </div>

            {/* Target Amount and Currency */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valor da Meta *
                </label>
                <LiquidInput
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  required
                  className="focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Moeda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Current Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Valor Atual (já poupado)
              </label>
              <LiquidInput
                type="number"
                step="0.01"
                value={formData.currentAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                placeholder="0,00"
                className="focus:ring-2 focus:ring-green-500"
              />
              {formData.targetAmount > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Progresso: {progressPercentage.toFixed(1)}%</span>
                    <span>{formData.currency} {formData.currentAmount?.toFixed(2)} / {formData.currency} {formData.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Target Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Data da Meta *
              </label>
              <LiquidInput
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                required
                className="focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Category and Priority */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecionar...</option>
                  <option value="veiculo">Veículo</option>
                  <option value="casa">Casa/Imóvel</option>
                  <option value="viagem">Viagem</option>
                  <option value="educacao">Educação</option>
                  <option value="emergencia">Fundo de Emergência</option>
                  <option value="aposentadoria">Aposentadoria</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
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
                disabled={submitting || !formData.title.trim() || !formData.targetDate}
                className="flex-1"
                glowColor="#10b981"
              >
                {submitting ? 'Salvando...' : goal?.id ? 'Atualizar' : 'Criar Meta'}
              </LiquidButton>
            </div>
          </form>
        </LiquidCard>
      </motion.div>
    </div>
  )
}