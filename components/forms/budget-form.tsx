'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { Budget, BudgetItem } from '@/types/budget'

interface BudgetFormProps {
  budget?: Budget
  onSubmit: (budget: Budget) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

export function BudgetForm({ budget, onSubmit, onCancel, loading }: BudgetFormProps) {
  const [formData, setFormData] = useState<Budget>({
    name: budget?.name || '',
    totalAmount: budget?.totalAmount || 0,
    items: budget?.items || [{ name: '', amount: 0, category: '' }]
  })

  const [submitting, setSubmitting] = useState(false)

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', amount: 0, category: '' }]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const updateItem = (index: number, field: keyof BudgetItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Calculate total amount from items if not manually set
      const calculatedTotal = formData.items.reduce((sum, item) => sum + item.amount, 0)
      const finalData = {
        ...formData,
        totalAmount: formData.totalAmount || calculatedTotal
      }

      await onSubmit(finalData)
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <LiquidCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {budget?.id ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h3>
              <button
                type="button"
                onClick={onCancel}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Budget Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nome do Orçamento
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Orçamento Dezembro 2024"
                required
              />
            </div>

            {/* Budget Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-slate-300">
                  Itens do Orçamento
                </label>
                <LiquidButton
                  type="button"
                  variant="secondary"
                  onClick={addItem}
                  className="text-sm"
                >
                  ➕ Adicionar Item
                </LiquidButton>
              </div>

              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div key={index} className="glass-effect p-4 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">Item {index + 1}</span>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm"
                        >
                          🗑️ Remover
                        </button>
                      )}
                    </div>

                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nome</label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Ex: Alimentação"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="0,00"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                        <select
                          value={item.category || ''}
                          onChange={(e) => updateItem(index, 'category', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Selecionar...</option>
                          <option value="alimentacao">Alimentação</option>
                          <option value="transporte">Transporte</option>
                          <option value="moradia">Moradia</option>
                          <option value="lazer">Lazer</option>
                          <option value="saude">Saúde</option>
                          <option value="educacao">Educação</option>
                          <option value="outros">Outros</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deixe vazio para calcular automaticamente"
              />
              <p className="text-xs text-slate-400 mt-1">
                Total calculado dos itens: R$ {formData.items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
              </p>
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
                disabled={submitting || !formData.name.trim()}
                className="flex-1"
              >
                {submitting ? 'Salvando...' : budget?.id ? 'Atualizar' : 'Criar Orçamento'}
              </LiquidButton>
            </div>
          </form>
        </LiquidCard>
      </motion.div>
    </div>
  )
}