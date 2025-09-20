'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LiquidInput } from '@/components/ui/liquid-input'

export interface LoanFormData {
  id?: string
  title: string
  description?: string
  amount: number
  currency: string
  lenderName: string
  lenderContact?: string
  type: string
  interestRate?: number | null
  dueDate?: string | null
  isPaid?: boolean
  installmentCount?: number | null
}

interface LoanFormProps {
  loan?: LoanFormData
  onSubmit: (loan: LoanFormData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function LoanForm({ loan, onSubmit, onCancel, loading }: LoanFormProps) {
  const [formData, setFormData] = useState<LoanFormData>({
    title: loan?.title || '',
    description: loan?.description || '',
    amount: loan?.amount || 0,
    currency: loan?.currency || 'BRL',
    lenderName: loan?.lenderName || '',
    lenderContact: loan?.lenderContact || '',
    type: loan?.type || 'lent',
    interestRate: loan?.interestRate || 0,
    dueDate: loan?.dueDate ? new Date(loan.dueDate).toISOString().split('T')[0] : '',
    isPaid: loan?.isPaid || false,
    installmentCount: loan?.installmentCount ?? null
  })

  const [submitting, setSubmitting] = useState(false)
  const installmentOptions = Array.from({ length: 24 }, (_, index) => index + 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const submitData = {
        ...formData,
        interestRate:
          formData.interestRate && formData.interestRate > 0 ? formData.interestRate : null,
        dueDate: formData.dueDate ? formData.dueDate : null,
        installmentCount: formData.installmentCount ? formData.installmentCount : null
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
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
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
              <LiquidInput
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder={isLending ? "Ex: Empréstimo para João" : "Ex: Empréstimo da Maria"}
                required
                className="focus:ring-2 focus:ring-yellow-500"
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
                <LiquidInput
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  required
                  className="focus:ring-2 focus:ring-yellow-500"
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

            {/* Installments */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Número de Parcelas
              </label>
              <select
                value={formData.installmentCount ? String(formData.installmentCount) : ''}
                onChange={(e) =>
                  setFormData(prev => ({
                    ...prev,
                    installmentCount: e.target.value ? Number(e.target.value) : null
                  }))
                }
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                <option value="">À vista</option>
                {installmentOptions.map(option => (
                  <option key={option} value={option}>
                    {option}x
                  </option>
                ))}
              </select>
            </div>

            {/* Lender Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {isLending ? 'Nome de quem recebeu *' : 'Nome de quem emprestou *'}
                </label>
                <LiquidInput
                  type="text"
                  value={formData.lenderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lenderName: e.target.value }))}
                  placeholder="Nome completo"
                  required
                  className="focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Contato
                </label>
                <LiquidInput
                  type="text"
                  value={formData.lenderContact}
                  onChange={(e) => setFormData(prev => ({ ...prev, lenderContact: e.target.value }))}
                  placeholder="Telefone ou email"
                  className="focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>

            {/* Interest Rate and Due Date */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Taxa de Juros (% a.a.)
                </label>
                <LiquidInput
                  type="number"
                  step="0.01"
                  value={formData.interestRate ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, interestRate: parseFloat(e.target.value) || 0 }))}
                  placeholder="0,00"
                  className="focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Data de Vencimento
                </label>
                <LiquidInput
                  type="date"
                  value={formData.dueDate ?? ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="focus:ring-2 focus:ring-yellow-500"
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