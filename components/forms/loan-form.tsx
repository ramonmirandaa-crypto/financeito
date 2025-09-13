'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'

interface Loan {
  id?: string
  title: string
  description?: string
  amount: number
  currency: string
  lenderName: string
  lenderContact?: string
  type: string
  interestRate?: number
  dueDate?: string
  isPaid?: boolean
}

interface LoanFormProps {
  loan?: Loan
  onSubmit: (loan: Loan) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function LoanForm({ loan, onSubmit, onCancel, loading }: LoanFormProps) {
  const [formData, setFormData] = useState<Loan>({
    title: loan?.title || '',
    description: loan?.description || '',
    amount: loan?.amount || 0,
    currency: loan?.currency || 'BRL',
    lenderName: loan?.lenderName || '',
    lenderContact: loan?.lenderContact || '',
    type: loan?.type || 'lent',
    interestRate: loan?.interestRate || 0,
    dueDate: loan?.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '',
    isPaid: loan?.isPaid || false
  })

  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData = {
        ...formData,
        interestRate: formData.interestRate && formData.interestRate > 0 ? formData.interestRate : undefined,
        dueDate: formData.dueDate || undefined
      }
      await onSubmit(submitData)
    } catch (error) {
      console.error('Erro ao salvar empréstimo:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const isLending = formData.type === 'lent'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        <LiquidCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {loan?.id ? 'Editar Empréstimo' : 'Novo Empréstimo'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Loan Type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo de Empréstimo *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'lent' }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.type === 'lent'
                      ? 'bg-green-500/20 border-green-400 text-green-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  💸 Emprestei
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: 'borrowed' }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                    formData.type === 'borrowed'
                      ? 'bg-red-500/20 border-red-400 text-red-300'
                      : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  💰 Peguei Emprestado
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Título do Empréstimo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder={isLending ? "Ex: Empréstimo para João" : "Ex: Empréstimo da Maria"}
                required
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
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                placeholder="Motivo do empréstimo, condições, etc..."
                rows={2}
              />
            </div>

            {/* Amount and Currency */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Valor *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="0,00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Moeda
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Lender Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isLending ? 'Nome de quem recebeu *' : 'Nome de quem emprestou *'}
                </label>
                <input
                  type="text"
                  value={formData.lenderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lenderName: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contato
                </label>
                <input
                  type="text"
                  value={formData.lenderContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, lenderContact: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="Telefone ou email"
                />
              </div>
            </div>

            {/* Interest Rate and Due Date */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Taxa de Juros (% a.a.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* Is Paid */}
            {loan?.id && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPaid: e.target.checked }))}
                  className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                />
                <label htmlFor="isPaid" className="text-sm text-slate-300">
                  Empréstimo quitado
                </label>
              </div>
            )}

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
                disabled={submitting || !formData.title.trim() || !formData.lenderName.trim()}
                className="flex-1"
                glowColor="#f59e0b"
              >
                {submitting ? 'Salvando...' : loan?.id ? 'Atualizar' : 'Criar Empréstimo'}
              </LiquidButton>
            </div>
          </form>
        </LiquidCard>
      </motion.div>
    </div>
  )
}