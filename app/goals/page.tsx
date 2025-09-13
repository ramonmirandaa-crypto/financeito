'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { GoalForm } from '@/components/forms/goal-form'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'

interface Goal {
  id: string
  title: string
  description?: string
  targetAmount: number
  currentAmount: number
  currency: string
  targetDate: string
  isCompleted: boolean
  category?: string
  priority: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<string | null>(null)

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    try {
      const res = await fetch('/api/goals')
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch (error) {
      console.error('Erro ao carregar metas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateGoal(goalData: any) {
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      
      if (res.ok) {
        const newGoal = await res.json()
        setGoals(prev => [newGoal, ...prev])
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Erro ao criar meta:', error)
    }
  }

  async function handleEditGoal(goalData: any) {
    if (!editingGoal) return
    
    try {
      const res = await fetch(`/api/goals/${editingGoal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData)
      })
      
      if (res.ok) {
        const updatedGoal = await res.json()
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? updatedGoal : g))
        setEditingGoal(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
    }
  }

  async function handleDeleteGoal(goalId: string) {
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goalId))
        setDeletingGoal(null)
      }
    } catch (error) {
      console.error('Erro ao deletar meta:', error)
    }
  }

  const totalGoalsValue = goals.reduce((acc, goal) => acc + goal.targetAmount, 0)
  const totalSavedValue = goals.reduce((acc, goal) => acc + goal.currentAmount, 0)
  const completedGoals = goals.filter(goal => goal.isCompleted).length
  const progressPercentage = totalGoalsValue > 0 ? (totalSavedValue / totalGoalsValue) * 100 : 0

  const priorityColors = {
    high: '#ef4444',
    medium: '#f59e0b', 
    low: '#10b981'
  }

  const categoryData = goals.reduce((acc: any[], goal) => {
    const category = goal.category || 'Outros'
    const existing = acc.find(item => item.name === category)
    if (existing) {
      existing.value += goal.targetAmount
      existing.saved += goal.currentAmount
    } else {
      acc.push({
        name: category,
        value: goal.targetAmount,
        saved: goal.currentAmount
      })
    }
    return acc
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">🎯 Metas Financeiras</h1>
          <p className="text-slate-400 mt-1">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <LiquidButton 
          variant="primary" 
          onClick={() => setShowCreateForm(true)}
          glowColor="#10b981"
        >
          ➕ Nova Meta
        </LiquidButton>
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
          <p className="mt-2 text-slate-400">Carregando metas...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Overview Cards */}
          <div className="lg:col-span-3 grid md:grid-cols-4 gap-4 mb-6">
            <LiquidCard variant="hoverable" glowColor="#10b981">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">R$ {totalSavedValue.toFixed(2)}</div>
                <div className="text-sm text-slate-400">Total Poupado</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#3b82f6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">R$ {totalGoalsValue.toFixed(2)}</div>
                <div className="text-sm text-slate-400">Total de Metas</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#f59e0b">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{progressPercentage.toFixed(1)}%</div>
                <div className="text-sm text-slate-400">Progresso Geral</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#8b5cf6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">{completedGoals}/{goals.length}</div>
                <div className="text-sm text-slate-400">Metas Concluídas</div>
              </div>
            </LiquidCard>
          </div>

          {/* Goals List */}
          <div className="lg:col-span-2 space-y-4">
            {goals.length === 0 ? (
              <LiquidCard>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Nenhuma meta criada</h3>
                  <p className="text-slate-400 mb-6">Defina seus objetivos financeiros e acompanhe seu progresso</p>
                  <LiquidButton 
                    variant="primary" 
                    onClick={() => setShowCreateForm(true)}
                  >
                    Criar Primeira Meta
                  </LiquidButton>
                </div>
              </LiquidCard>
            ) : (
              goals.map((goal, index) => {
                const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100
                const isOverdue = new Date(goal.targetDate) < new Date() && !goal.isCompleted
                const priorityColor = priorityColors[goal.priority as keyof typeof priorityColors]
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <LiquidCard variant="hoverable">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            {goal.title}
                            {goal.isCompleted && <span className="text-green-400">✅</span>}
                            {isOverdue && <span className="text-red-400">⚠️</span>}
                          </h3>
                          {goal.description && (
                            <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: priorityColor }}
                          />
                          <span className="text-xs text-slate-400 capitalize">{goal.priority}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-300">Progresso:</span>
                          <span className="text-white font-semibold">
                            {goal.currency} {goal.currentAmount.toFixed(2)} / {goal.currency} {goal.targetAmount.toFixed(2)}
                          </span>
                        </div>

                        <div className="w-full bg-slate-700 rounded-full h-3">
                          <motion.div 
                            className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs text-slate-400">
                          <span>{progressPercentage.toFixed(1)}% concluído</span>
                          <span>Meta: {new Date(goal.targetDate).toLocaleDateString()}</span>
                        </div>

                        {goal.category && (
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                            {goal.category}
                          </span>
                        )}
                      </div>
                    </LiquidCard>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Categories Chart */}
            {categoryData.length > 0 && (
              <LiquidCard>
                <h4 className="text-lg font-semibold mb-4 text-white">Metas por Categoria</h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        data={categoryData}
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={80}
                        fill="#8884d8"
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={`hsl(${i * 45}, 70%, 60%)`} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor da Meta']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </LiquidCard>
            )}

            {/* Quick Stats */}
            <LiquidCard>
              <h4 className="text-lg font-semibold mb-4 text-white">Estatísticas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Metas:</span>
                  <span className="text-white font-semibold">{goals.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Concluídas:</span>
                  <span className="text-green-400 font-semibold">{completedGoals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Em Progresso:</span>
                  <span className="text-blue-400 font-semibold">{goals.length - completedGoals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Alta Prioridade:</span>
                  <span className="text-red-400 font-semibold">
                    {goals.filter(g => g.priority === 'high').length}
                  </span>
                </div>
              </div>
            </LiquidCard>
          </div>
        </div>
      )}

      {/* Goal Forms */}
      {showCreateForm && (
        <GoalForm
          onSubmit={handleCreateGoal}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingGoal && (
        <GoalForm
          goal={editingGoal}
          onSubmit={handleEditGoal}
          onCancel={() => setEditingGoal(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LiquidCard className="max-w-md w-full m-4">
            <h3 className="text-xl font-semibold mb-4 text-white">Confirmar Exclusão</h3>
            <p className="text-slate-400 mb-6">Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <LiquidButton 
                variant="secondary" 
                onClick={() => setDeletingGoal(null)}
                className="flex-1"
              >
                Cancelar
              </LiquidButton>
              <LiquidButton 
                variant="primary" 
                onClick={() => handleDeleteGoal(deletingGoal)}
                className="flex-1 bg-red-500 hover:bg-red-600"
              >
                Excluir
              </LiquidButton>
            </div>
          </LiquidCard>
        </div>
      )}
    </div>
  )
}