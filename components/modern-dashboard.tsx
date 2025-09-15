"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  PiggyBank, 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  Bell,
  Settings,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Building,
  Shield,
  Download,
  Upload,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Interfaces
interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  account: string;
}

interface Goal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  category: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'credit' | 'investment';
  currency: string;
}

interface Budget {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: "1",
    description: "Salário - Empresa XYZ",
    amount: 5500.00,
    date: "2024-01-15",
    category: "Salário",
    type: "income",
    account: "Conta Corrente"
  },
  {
    id: "2", 
    description: "Supermercado Extra",
    amount: -320.50,
    date: "2024-01-14",
    category: "Alimentação",
    type: "expense",
    account: "Cartão de Crédito"
  },
  {
    id: "3",
    description: "Netflix",
    amount: -29.90,
    date: "2024-01-13",
    category: "Entretenimento",
    type: "expense",
    account: "Conta Corrente"
  },
  {
    id: "4",
    description: "Freelance Design",
    amount: 800.00,
    date: "2024-01-12",
    category: "Freelance",
    type: "income",
    account: "Conta Corrente"
  }
];

const mockGoals: Goal[] = [
  {
    id: "1",
    name: "Viagem para Europa",
    target: 15000,
    current: 8500,
    deadline: "2024-12-31",
    category: "Viagem"
  },
  {
    id: "2",
    name: "Reserva de Emergência",
    target: 30000,
    current: 22000,
    deadline: "2024-06-30",
    category: "Emergência"
  },
  {
    id: "3",
    name: "Novo Notebook",
    target: 4500,
    current: 2800,
    deadline: "2024-03-31",
    category: "Tecnologia"
  }
];

const mockAccounts: Account[] = [
  {
    id: "1",
    name: "Conta Corrente",
    balance: 12500.75,
    type: "checking",
    currency: "BRL"
  },
  {
    id: "2",
    name: "Poupança",
    balance: 25000.00,
    type: "savings", 
    currency: "BRL"
  },
  {
    id: "3",
    name: "Cartão de Crédito",
    balance: -1850.30,
    type: "credit",
    currency: "BRL"
  },
  {
    id: "4",
    name: "Investimentos",
    balance: 45000.00,
    type: "investment",
    currency: "BRL"
  }
];

const mockBudgets: Budget[] = [
  { category: "Alimentação", allocated: 800, spent: 520, remaining: 280 },
  { category: "Transporte", allocated: 400, spent: 350, remaining: 50 },
  { category: "Entretenimento", allocated: 300, spent: 180, remaining: 120 },
  { category: "Saúde", allocated: 500, spent: 200, remaining: 300 },
  { category: "Educação", allocated: 200, spent: 150, remaining: 50 }
];

// Utility functions
const formatCurrency = (amount: number, currency: string = "BRL") => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

// Components
const DashboardHeader = ({ showBalance, setShowBalance }: { showBalance: boolean, setShowBalance: (show: boolean) => void }) => {
  const totalBalance = mockAccounts.reduce((sum, account) => sum + account.balance, 0);
  const monthlyIncome = mockTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyExpenses = mockTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary-glow/20 backdrop-blur-xl border border-white/20 p-8 mb-8">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary-glow/10 backdrop-blur-3xl"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl translate-y-48 -translate-x-48"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">💰 Financeito</h1>
              <p className="text-muted-foreground">Suas finanças em um só lugar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card-glass/60 backdrop-blur-xl border-card-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-muted-foreground">Saldo Total</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                  className="h-6 w-6"
                >
                  {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-3xl font-bold text-foreground">
                {showBalance ? formatCurrency(totalBalance) : "••••••••"}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="w-4 h-4 text-success" />
                <span className="text-sm text-success">+2.5% este mês</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-glass/60 backdrop-blur-xl border-card-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="text-sm text-muted-foreground">Receitas</p>
              </div>
              <p className="text-2xl font-bold text-success">
                {showBalance ? formatCurrency(monthlyIncome) : "••••••••"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card-glass/60 backdrop-blur-xl border-card-border/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <p className="text-sm text-muted-foreground">Despesas</p>
              </div>
              <p className="text-2xl font-bold text-destructive">
                {showBalance ? formatCurrency(monthlyExpenses) : "••••••••"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TransactionsList = ({ showBalance }: { showBalance: boolean }) => {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Transações Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTransactions.slice(0, 5).map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-xl bg-card-glass/30 backdrop-blur-sm border border-card-border/30"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === 'income' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                  {transaction.type === 'income' ? 
                    <ArrowUpRight className="w-5 h-5" /> : 
                    <ArrowDownRight className="w-5 h-5" />
                  }
                </div>
                <div>
                  <p className="font-medium text-foreground">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{transaction.category} • {formatDate(transaction.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${transaction.type === 'income' ? 'text-success' : 'text-destructive'}`}>
                  {showBalance ? formatCurrency(Math.abs(transaction.amount)) : "••••"}
                </p>
                <p className="text-sm text-muted-foreground">{transaction.account}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4 bg-card-glass/30 border-card-border/50">
          Ver Todas as Transações
        </Button>
      </CardContent>
    </Card>
  );
};

const GoalsSection = ({ showBalance }: { showBalance: boolean }) => {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Metas Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mockGoals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-xl bg-card-glass/30 backdrop-blur-sm border border-card-border/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-foreground">{goal.name}</h4>
                    <p className="text-sm text-muted-foreground">Prazo: {formatDate(goal.deadline)}</p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {goal.category}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {showBalance ? formatCurrency(goal.current) : "••••••"} de {showBalance ? formatCurrency(goal.target) : "••••••"}
                    </span>
                    <span className="text-primary">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2 bg-white/10" />
                </div>
              </motion.div>
            );
          })}
        </div>
        <Button variant="outline" className="w-full mt-4 bg-card-glass/30 border-card-border/50">
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </CardContent>
    </Card>
  );
};

const AccountsOverview = ({ showBalance }: { showBalance: boolean }) => {
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking': return <Wallet className="w-5 h-5" />;
      case 'savings': return <PiggyBank className="w-5 h-5" />;
      case 'credit': return <CreditCard className="w-5 h-5" />;
      case 'investment': return <TrendingUp className="w-5 h-5" />;
      default: return <DollarSign className="w-5 h-5" />;
    }
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking': return 'text-blue-500 bg-blue-500/20';
      case 'savings': return 'text-success bg-success/20';
      case 'credit': return 'text-destructive bg-destructive/20';
      case 'investment': return 'text-primary bg-primary/20';
      default: return 'text-gray-500 bg-gray-500/20';
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="w-5 h-5" />
          Visão Geral das Contas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAccounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 rounded-xl bg-card-glass/30 backdrop-blur-sm border border-card-border/30"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAccountColor(account.type)}`}>
                  {getAccountIcon(account.type)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{account.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {account.type === 'checking' ? 'Conta Corrente' :
                     account.type === 'savings' ? 'Poupança' :
                     account.type === 'credit' ? 'Cartão de Crédito' : 
                     'Investimentos'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${account.balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                  {showBalance ? formatCurrency(account.balance) : "••••••••"}
                </p>
                <p className="text-sm text-muted-foreground">{account.currency}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const BudgetOverview = ({ showBalance }: { showBalance: boolean }) => {
  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Orçamento do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockBudgets.map((budget, index) => {
            const percentage = (budget.spent / budget.allocated) * 100;
            return (
              <motion.div
                key={budget.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-foreground">{budget.category}</p>
                  <p className="text-sm text-muted-foreground">
                    {showBalance ? formatCurrency(budget.spent) : "••••"} / {showBalance ? formatCurrency(budget.allocated) : "••••"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${percentage > 90 ? 'bg-destructive/20' : percentage > 70 ? 'bg-warning/20' : 'bg-primary/20'}`}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={percentage > 90 ? 'text-destructive' : percentage > 70 ? 'text-warning' : 'text-primary'}>
                      {percentage.toFixed(1)}% usado
                    </span>
                    <span className="text-muted-foreground">
                      Resta: {showBalance ? formatCurrency(budget.remaining) : "••••"}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// Main Dashboard Component
export default function ModernDashboard() {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader showBalance={showBalance} setShowBalance={setShowBalance} />
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <TransactionsList showBalance={showBalance} />
              <AccountsOverview showBalance={showBalance} />
            </div>
            <div className="space-y-6">
              <GoalsSection showBalance={showBalance} />
              <BudgetOverview showBalance={showBalance} />
            </div>
          </TabsContent>
          
          <TabsContent value="transactions">
            <TransactionsList showBalance={showBalance} />
          </TabsContent>
          
          <TabsContent value="goals">
            <GoalsSection showBalance={showBalance} />
          </TabsContent>
          
          <TabsContent value="budget">
            <BudgetOverview showBalance={showBalance} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}