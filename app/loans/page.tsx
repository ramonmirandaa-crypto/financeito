'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LiquidCard } from '@/components/ui/liquid-card'
import { LiquidButton } from '@/components/ui/liquid-button'
import { LoanForm } from '@/components/forms/loan-form'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts'

interface Loan {
  id: string
  title: string
  description?: string
  amount: number
  currency: string
  lenderName: string
  lenderContact?: string
  type: string // 'lent' ou 'borrowed'
  interestRate?: number
  dueDate?: string
  isPaid: boolean
  paidAt?: string
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [deletingLoan, setDeletingLoan] = useState<string | null>(null)

  useEffect(() => {
    loadLoans()
  }, [])

  async function loadLoans() {
    try {
      const res = await fetch('/api/loans')
      if (res.ok) {
        const data = await res.json()
        setLoans(data)
      }
    } catch (error) {
      console.error('Erro ao carregar empréstimos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateLoan(loanData: any) {
    try {
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      })
      
      if (res.ok) {
        const newLoan = await res.json()
        setLoans(prev => [newLoan, ...prev])
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error)
    }
  }

  async function handleEditLoan(loanData: any) {
    if (!editingLoan) return
    
    try {
      const res = await fetch(`/api/loans/${editingLoan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loanData)
      })
      
      if (res.ok) {
        const updatedLoan = await res.json()
        setLoans(prev => prev.map(l => l.id === editingLoan.id ? updatedLoan : l))
        setEditingLoan(null)
      }
    } catch (error) {
      console.error('Erro ao atualizar empréstimo:', error)
    }
  }

  async function handleDeleteLoan(loanId: string) {
    try {
      const res = await fetch(`/api/loans/${loanId}`, {
        method: 'DELETE'
      })
      
      if (res.ok) {
        setLoans(prev => prev.filter(l => l.id !== loanId))
        setDeletingLoan(null)
      }
    } catch (error) {
      console.error('Erro ao deletar empréstimo:', error)
    }
  }

  const lentLoans = loans.filter(loan => loan.type === 'lent')
  const borrowedLoans = loans.filter(loan => loan.type === 'borrowed')
  
  const totalLent = lentLoans.reduce((acc, loan) => acc + (loan.isPaid ? 0 : loan.amount), 0)
  const totalBorrowed = borrowedLoans.reduce((acc, loan) => acc + (loan.isPaid ? 0 : loan.amount), 0)
  
  const paidLoans = loans.filter(loan => loan.isPaid).length
  const pendingLoans = loans.filter(loan => !loan.isPaid).length

  const overdueLoanArray = loans.filter(loan => {
    if (loan.isPaid || !loan.dueDate) return false
    return new Date(loan.dueDate) < new Date()
  })

  const typeData = [
    { name: 'Emprestei', value: totalLent, count: lentLoans.filter(l => !l.isPaid).length },
    { name: 'Peguei Emprestado', value: totalBorrowed, count: borrowedLoans.filter(l => !l.isPaid).length }
  ]

  const colors = ['#10b981', '#ef4444']

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">💰 Empréstimos Familiares</h1>
          <p className="text-slate-400 mt-1">Controle empréstimos feitos e recebidos entre família e amigos</p>
        </div>
        <LiquidButton 
          variant="primary" 
          onClick={() => setShowCreateForm(true)}
          glowColor="#f59e0b"
        >
          ➕ Novo Empréstimo
        </LiquidButton>
      </motion.div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
          <p className="mt-2 text-slate-400">Carregando empréstimos...</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Overview Cards */}
          <div className="lg:col-span-3 grid md:grid-cols-4 gap-4 mb-6">
            <LiquidCard variant="hoverable" glowColor="#10b981">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">R$ {totalLent.toFixed(2)}</div>
                <div className="text-sm text-slate-400">Emprestei (Pendente)</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#ef4444">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">R$ {totalBorrowed.toFixed(2)}</div>
                <div className="text-sm text-slate-400">Devo (Pendente)</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#3b82f6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{paidLoans}</div>
                <div className="text-sm text-slate-400">Empréstimos Quitados</div>
              </div>
            </LiquidCard>
            
            <LiquidCard variant="hoverable" glowColor="#f59e0b">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{overdueLoanArray.length}</div>
                <div className="text-sm text-slate-400">Em Atraso</div>
              </div>
            </LiquidCard>
          </div>

          {/* Loans List */}
          <div className="lg:col-span-2 space-y-4">
            {loans.length === 0 ? (
              <LiquidCard>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Nenhum empréstimo registrado</h3>
                  <p className="text-slate-400 mb-6">Registre empréstimos familiares para manter o controle financeiro</p>
                  <LiquidButton 
                    variant="primary" 
                    onClick={() => setShowCreateForm(true)}
                  >
                    Registrar Primeiro Empréstimo
                  </LiquidButton>
                </div>
              </LiquidCard>
            ) : (
              loans.map((loan, index) => {
                const isOverdue = loan.dueDate && new Date(loan.dueDate) < new Date() && !loan.isPaid
                const typeIcon = loan.type === 'lent' ? '💸' : '💰'
                const typeColor = loan.type === 'lent' ? 'text-green-400' : 'text-red-400'
                const typeText = loan.type === 'lent' ? 'Emprestei para' : 'Peguei emprestado de'
                
                return (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <LiquidCard variant="hoverable">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            {typeIcon} {loan.title}
                            {loan.isPaid && <span className="text-green-400">✅</span>}
                            {isOverdue && <span className="text-red-400">⚠️</span>}
                          </h3>
                          {loan.description && (
                            <p className="text-sm text-slate-400 mt-1">{loan.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${typeColor}`}>
                            {loan.currency} {loan.amount.toFixed(2)}
                          </div>
                          {loan.interestRate && (
                            <div className="text-xs text-slate-400">
                              {loan.interestRate}% a.a.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm text-slate-300">
                          <span className={typeColor}>{typeText}</span>
                          <span className="font-semibold ml-1">{loan.lenderName}</span>
                          {loan.lenderContact && (
                            <span className="text-slate-400"> • {loan.lenderContact}</span>
                          )}
                        </div>

                        {loan.dueDate && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-300">Vencimento:</span>
                            <span className={`font-semibold ${
                              loan.isPaid ? 'text-green-400' :
                              isOverdue ? 'text-red-400' : 
                              'text-slate-300'
                            }`}>
                              {new Date(loan.dueDate).toLocaleDateString()}
                              {isOverdue && ' (Atrasado)'}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                            loan.isPaid 
                              ? 'bg-green-500/20 text-green-300' 
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {loan.isPaid ? 'Quitado' : 'Pendente'}
                          </span>
                          
                          {loan.isPaid && loan.paidAt && (
                            <span className="text-xs text-slate-400">
                              Pago em {new Date(loan.paidAt).toLocaleDateString()}
                            </span>
                          )}
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
            {/* Type Distribution Chart */}
            {typeData.some(d => d.value > 0) && (
              <LiquidCard>
                <h4 className="text-lg font-semibold mb-4 text-white">Distribuição de Empréstimos</h4>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie 
                        data={typeData.filter(d => d.value > 0)}
                        dataKey="value" 
                        nameKey="name" 
                        outerRadius={80}
                      >
                        {typeData.filter(d => d.value > 0).map((_, i) => (
                          <Cell key={i} fill={colors[i % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Valor Pendente']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </LiquidCard>
            )}

            {/* Overdue Loans */}
            {overdueLoanArray.length > 0 && (
              <LiquidCard>
                <h4 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  ⚠️ Empréstimos Atrasados
                </h4>
                <div className="space-y-3">
                  {overdueLoanArray.slice(0, 5).map((loan) => (
                    <div key={loan.id} className="p-3 glass-effect rounded-lg border border-red-400/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white text-sm">{loan.title}</div>
                          <div className="text-xs text-slate-400">{loan.lenderName}</div>
                          <div className="text-xs text-red-400">
                            Venceu em {loan.dueDate && new Date(loan.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-400 text-sm">
                            {loan.currency} {loan.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </LiquidCard>
            )}

            {/* Quick Stats */}
            <LiquidCard>
              <h4 className="text-lg font-semibold mb-4 text-white">Estatísticas</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total de Empréstimos:</span>
                  <span className="text-white font-semibold">{loans.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quitados:</span>
                  <span className="text-green-400 font-semibold">{paidLoans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pendentes:</span>
                  <span className="text-yellow-400 font-semibold">{pendingLoans}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Em Atraso:</span>
                  <span className="text-red-400 font-semibold">{overdueLoanArray.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Saldo Líquido:</span>
                  <span className={`font-semibold ${
                    totalLent > totalBorrowed ? 'text-green-400' : 
                    totalLent < totalBorrowed ? 'text-red-400' : 
                    'text-slate-300'
                  }`}>
                    R$ {(totalLent - totalBorrowed).toFixed(2)}
                  </span>
                </div>
              </div>
            </LiquidCard>
          </div>
        </div>
      )}

      {/* Loan Forms */}
      {showCreateForm && (
        <LoanForm
          onSubmit={handleCreateLoan}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingLoan && (
        <LoanForm
          loan={editingLoan}
          onSubmit={handleEditLoan}
          onCancel={() => setEditingLoan(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingLoan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <LiquidCard className="max-w-md w-full m-4">
            <h3 className="text-xl font-semibold mb-4 text-white">Confirmar Exclusão</h3>
            <p className="text-slate-400 mb-6">Tem certeza que deseja excluir este empréstimo? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <LiquidButton 
                variant="secondary" 
                onClick={() => setDeletingLoan(null)}
                className="flex-1"
              >
                Cancelar
              </LiquidButton>
              <LiquidButton 
                variant="primary" 
                onClick={() => handleDeleteLoan(deletingLoan)}
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