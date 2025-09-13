'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'

interface Budget {
  id: string
  name: string
  totalAmount: number
  currency: string
  period: string
  startDate: string
  endDate: string
  isActive: boolean
  items: BudgetItem[]
}

interface BudgetItem {
  id: string
  category: string
  amount: number
  spent: number
  currency: string
}

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadBudgets()
  }, [])

  async function loadBudgets() {
    try {
      const res = await fetch('/api/budget')
      if (res.ok) {
        const data = await res.json()
        setBudgets(data)
      }
    } catch (error) {
      console.error('Erro ao carregar orçamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#8dd1e1', '#ff7c7c']

  const activeBudget = budgets.find(b => b.isActive)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">💰 Orçamento</h1>
          <p className="text-slate-400 mt-1">Gerencie seus gastos e mantenha o controle financeiro</p>
        </div>
        <LiquidButton 
          variant="primary" 
          onClick={() => setShowCreateForm(true)}
          glowColor="#3b82f6"
        >
          ➕ Novo Orçamento
        </LiquidButton>
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          <p className="mt-2 text-slate-400">Carregando orçamentos...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Budget Overview */}
          <div className="lg:col-span-2 space-y-6">
            {activeBudget ? (
              <>
                <LiquidCard variant="hoverable" glowColor="#3b82f6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{activeBudget.name}</h3>
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-400/30">
                      Ativo
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Período: {activeBudget.period}</p>
                      <p className="text-sm text-slate-400 mb-4">
                        {new Date(activeBudget.startDate).toLocaleDateString()} - {new Date(activeBudget.endDate).toLocaleDateString()}
                      </p>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Orçamento Total:</span>
                          <span className="font-semibold text-white">
                            {activeBudget.currency} {activeBudget.totalAmount.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-slate-300">Total Gasto:</span>
                          <span className="font-semibold text-red-300">
                            {activeBudget.currency} {activeBudget.items.reduce((acc, item) => acc + item.spent, 0).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-slate-300">Restante:</span>
                          <span className="font-semibold text-green-300">
                            {activeBudget.currency} {(activeBudget.totalAmount - activeBudget.items.reduce((acc, item) => acc + item.spent, 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', height: 200 }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie 
                            data={activeBudget.items.map(item => ({
                              name: item.category,
                              value: item.spent,
                              budget: item.amount
                            }))}
                            dataKey="value" 
                            nameKey="name" 
                            outerRadius={80}
                          >
                            {activeBudget.items.map((_, i) => (
                              <Cell key={i} fill={colors[i % colors.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any, name: any, props: any) => [
                            `Gasto: ${value}`, 
                            `${name} (Orçamento: ${props.payload.budget})`
                          ]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </LiquidCard>

                {/* Budget Categories */}
                <LiquidCard>
                  <h4 className="text-lg font-semibold mb-4 text-white">Categorias do Orçamento</h4>
                  <div className="space-y-3">
                    {activeBudget.items.map((item, index) => {
                      const percentage = (item.spent / item.amount) * 100
                      const isOverBudget = percentage > 100
                      
                      return (
                        <div key={item.id} className="p-4 glass-effect rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white">{item.category}</span>
                            <span className={`text-sm ${isOverBudget ? 'text-red-300' : 'text-slate-300'}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
                            <span>Gasto: {item.currency} {item.spent.toFixed(2)}</span>
                            <span>Orçamento: {item.currency} {item.amount.toFixed(2)}</span>
                          </div>
                          
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <motion.div 
                              className={`h-2 rounded-full ${isOverBudget ? 'bg-red-500' : 'bg-blue-500'}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(percentage, 100)}%` }}
                              transition={{ duration: 0.5, delay: index * 0.1 }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </LiquidCard>
              </>
            ) : (
              <LiquidCard>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Nenhum orçamento ativo</h3>
                  <p className="text-slate-400 mb-6">Crie seu primeiro orçamento para começar a controlar seus gastos</p>
                  <LiquidButton 
                    variant="primary" 
                    onClick={() => setShowCreateForm(true)}
                  >
                    Criar Orçamento
                  </LiquidButton>
                </div>
              </LiquidCard>
            )}
          </div>

          {/* Sidebar - All Budgets */}
          <div className="space-y-6">
            <LiquidCard>
              <h4 className="text-lg font-semibold mb-4 text-white">Todos os Orçamentos</h4>
              <div className="space-y-3">
                {budgets.length === 0 ? (
                  <p className="text-slate-400 text-sm">Nenhum orçamento criado ainda</p>
                ) : (
                  budgets.map((budget) => (
                    <div key={budget.id} className="p-3 glass-effect rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white text-sm">{budget.name}</span>
                        {budget.isActive && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs border border-green-400/30">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{budget.currency} {budget.totalAmount.toFixed(2)}</p>
                      <p className="text-xs text-slate-400">{budget.period}</p>
                    </div>
                  ))
                )}
              </div>
            </LiquidCard>

            {/* Quick Stats */}
            <LiquidCard>
              <h4 className="text-lg font-semibold mb-4 text-white">Estatísticas Rápidas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Orçamentos:</span>
                  <span className="text-white font-semibold">{budgets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Orçamentos Ativos:</span>
                  <span className="text-white font-semibold">{budgets.filter(b => b.isActive).length}</span>
                </div>
                {activeBudget && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Categorias:</span>
                    <span className="text-white font-semibold">{activeBudget.items.length}</span>
                  </div>
                )}
              </div>
            </LiquidCard>
          </div>
        </div>
      )}

      {/* Create Budget Modal - Placeholder for now */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateForm(false)}>
          <LiquidCard className="max-w-md w-full m-4" onClick={() => {}}>
            <h3 className="text-xl font-semibold mb-4 text-white">Criar Novo Orçamento</h3>
            <p className="text-slate-400 mb-4">Funcionalidade em desenvolvimento...</p>
            <LiquidButton variant="secondary" onClick={() => setShowCreateForm(false)}>
              Fechar
            </LiquidButton>
          </LiquidCard>
        </div>
      )}
    </div>
  )
}