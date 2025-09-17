'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { ConfirmDeleteModal } from '@/components/ui/confirm-delete-modal'
import { SubscriptionForm } from '@/components/forms/subscription-form'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'

interface Subscription {
  id: string
  name: string
  description?: string
  amount: number
  currency: string
  billingCycle: string
  nextBilling: string
  isActive: boolean
  category?: string
  autoRenew: boolean
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [deletingSubscription, setDeletingSubscription] = useState<string | null>(null)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    try {
      const res = await fetch('/api/subscriptions')
      if (res.ok) {
        const data = await res.json()
        setSubscriptions(data)
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateSubscription(subscriptionData: any) {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      })
      
      if (res.ok) {
        const newSubscription = await res.json()
        setSubscriptions(prev => [newSubscription, ...prev])
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error)
    }
  }

  async function handleEditSubscription(subscriptionData: any) {
    if (!editingSubscription) return
    
    try {
      const res = await fetch(`/api/subscriptions/${editingSubscription.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscriptionData)
      })
      
      if (res.ok) {
        const updatedSubscription = await res.json()
        setSubscriptions(prev => prev.map(s => s.id === editingSubscription.id ? updatedSubscription : s))
        setEditingSubscription(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error)
    }
  }

  async function handleDeleteSubscription(subscriptionId: string) {
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== subscriptionId))
        setDeletingSubscription(null)
      }
    } catch (error) {
      console.error('Erro ao deletar assinatura:', error)
    }
  }

  const activeSubscriptions = subscriptions.filter(sub => sub.isActive)
  const monthlyTotal = activeSubscriptions
    .filter(sub => sub.billingCycle === 'monthly')
    .reduce((acc, sub) => acc + sub.amount, 0)
  
  const yearlyTotal = activeSubscriptions
    .filter(sub => sub.billingCycle === 'yearly')
    .reduce((acc, sub) => acc + sub.amount, 0)

  const categoryData = subscriptions.reduce((acc: any[], sub) => {
    if (!sub.isActive) return acc
    const category = sub.category || 'Outros'
    const existing = acc.find(item => item.name === category)
    if (existing) {
      existing.value += sub.amount
      existing.count += 1
    } else {
      acc.push({
        name: category,
        value: sub.amount,
        count: 1
      })
    }
    return acc
  }, [])

  const upcomingBilling = activeSubscriptions
    .filter(sub => {
      const nextBilling = new Date(sub.nextBilling)
      const now = new Date()
      const daysDiff = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 3600 * 24))
      return daysDiff <= 7 && daysDiff >= 0
    })
    .sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime())

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#8dd1e1', '#ff7c7c']

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">🔄 Assinaturas</h1>
          <p className="text-slate-400 mt-1">Gerencie suas assinaturas e gastos recorrentes</p>
        </div>
        <LiquidButton 
          variant="primary" 
          onClick={() => setShowCreateForm(true)}
          glowColor="#8b5cf6"
        >
          ➕ Nova Assinatura
        </LiquidButton>
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          <p className="mt-2 text-slate-400">Carregando assinaturas...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Overview Cards */}
          <div className="lg:col-span-3 grid md:grid-cols-4 gap-4 mb-6">
            <LiquidCard variant="hoverable" glowColor="#8b5cf6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">R$ {monthlyTotal.toFixed(2)}</div>
                <div className="text-sm text-slate-400">Gastos Mensais</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#3b82f6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">R$ {yearlyTotal.toFixed(2)}</div>
                <div className="text-sm text-slate-400">Gastos Anuais</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#10b981">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{activeSubscriptions.length}</div>
                <div className="text-sm text-slate-400">Assinaturas Ativas</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#f59e0b">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{upcomingBilling.length}</div>
                <div className="text-sm text-slate-400">Próximas Cobranças (7 dias)</div>
              </div>
            </LiquidCard>
          </div>

          {/* Subscriptions List */}
          <div className="lg:col-span-2 space-y-4">
            {subscriptions.length === 0 ? (
              <LiquidCard>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔄</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Nenhuma assinatura cadastrada</h3>
                  <p className="text-slate-400 mb-6">Gerencie todas suas assinaturas e gastos recorrentes em um só lugar</p>
                  <LiquidButton 
                    variant="primary" 
                    onClick={() => setShowCreateForm(true)}
                  >
                    Adicionar Primeira Assinatura
                  </LiquidButton>
                </div>
              </LiquidCard>
            ) : (
              subscriptions.map((subscription, index) => {
                const nextBilling = new Date(subscription.nextBilling)
                const now = new Date()
                const daysDiff = Math.ceil((nextBilling.getTime() - now.getTime()) / (1000 * 3600 * 24))
                const isUpcoming = daysDiff <= 7 && daysDiff >= 0
                const isOverdue = daysDiff < 0
                
                return (
                  <motion.div
                    key={subscription.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <LiquidCard variant="hoverable">
                      <div className="flex items-start justify-between mb-3">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              {subscription.name}
                              {!subscription.isActive && <span className="text-gray-400">⏸️</span>}
                              {isUpcoming && <span className="text-yellow-400">⚠️</span>}
                              {isOverdue && <span className="text-red-400">❗</span>}
                            </h3>
                            <div className="flex items-center gap-2">
                              <LiquidButton
                                size="sm"
                                variant="outline"
                                className="text-xs text-blue-300 border-blue-500/50 hover:bg-blue-500/10"
                                onClick={() => setEditingSubscription(subscription)}
                              >
                                ✏️ Editar
                              </LiquidButton>
                              <LiquidButton
                                size="sm"
                                variant="outline"
                                className="text-xs text-red-300 border-red-500/50 hover:bg-red-500/10"
                                onClick={() => setDeletingSubscription(subscription.id)}
                              >
                                🗑️ Excluir
                              </LiquidButton>
                            </div>
                          </div>
                          {subscription.description && (
                            <p className="text-sm text-slate-400">{subscription.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            {subscription.currency} {subscription.amount.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">
                            {subscription.billingCycle}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-300">Próxima cobrança:</span>
                          <span className={`font-semibold ${
                            isOverdue ? 'text-red-400' : 
                            isUpcoming ? 'text-yellow-400' : 
                            'text-slate-300'
                          }`}>
                            {nextBilling.toLocaleDateString()}
                            {daysDiff >= 0 && ` (${daysDiff} dias)`}
                            {daysDiff < 0 && ` (${Math.abs(daysDiff)} dias atrás)`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          {subscription.category && (
                            <span className="inline-block px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">
                              {subscription.category}
                            </span>
                          )}
                          
                          <div className="flex items-center space-x-2 text-xs">
                            <span className={`px-2 py-1 rounded ${
                              subscription.isActive 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-gray-500/20 text-gray-400'
                            }`}>
                              {subscription.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                            {subscription.autoRenew && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                                Auto-renovação
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </LiquidCard>
                  </motion.div>
                )
              })
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Billing */}
            {upcomingBilling.length > 0 && (
              <LiquidCard>
                <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  ⏰ Próximas Cobranças
                </h4>
                <div className="space-y-3">
                  {upcomingBilling.slice(0, 5).map((sub) => (
                    <div key={sub.id} className="p-3 glass-effect rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white text-sm">{sub.name}</div>
                          <div className="text-xs text-slate-400">
                            {new Date(sub.nextBilling).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-yellow-400 text-sm">
                            {sub.currency} {sub.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </LiquidCard>
            )}

            {/* Categories Chart */}
            {categoryData.length > 0 && (
              <LiquidCard>
                <h4 className="text-lg font-semibold mb-4 text-white">Gastos por Categoria</h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        data={categoryData}
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={80}
                      >
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={colors[i % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor Mensal']} />
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
                  <span className="text-slate-400">Total:</span>
                  <span className="text-white font-semibold">{subscriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ativas:</span>
                  <span className="text-green-400 font-semibold">{activeSubscriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inativas:</span>
                  <span className="text-gray-400 font-semibold">{subscriptions.length - activeSubscriptions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gasto Anual Estimado:</span>
                  <span className="text-purple-400 font-semibold">
                    R$ {(monthlyTotal * 12 + yearlyTotal).toFixed(2)}
                  </span>
                </div>
              </div>
            </LiquidCard>
          </div>
        </div>
      )}

      {/* Subscription Forms */}
      {showCreateForm && (
        <SubscriptionForm
          onSubmit={handleCreateSubscription}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingSubscription && (
        <SubscriptionForm
          subscription={editingSubscription}
          onSubmit={handleEditSubscription}
          onCancel={() => setEditingSubscription(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deletingSubscription)}
        message="Tem certeza que deseja excluir esta assinatura? Esta ação não pode ser desfeita."
        onCancel={() => setDeletingSubscription(null)}
        onConfirm={() => handleDeleteSubscription(deletingSubscription!)}
      />
    </div>
  )
}