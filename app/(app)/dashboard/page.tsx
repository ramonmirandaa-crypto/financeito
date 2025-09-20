'use client'

import { motion } from 'framer-motion'
import { useDashboardData } from '@/hooks/use-dashboard-data'
import { KpiGrid } from '@/components/dashboard/kpi-grid'
import { UpcomingPaymentsCard } from '@/components/dashboard/upcoming-payments-card'
import { DashboardQuickActions } from '@/components/dashboard/dashboard-quick-actions'
import { DashboardQuickAccess } from '@/components/dashboard/dashboard-quick-access'
import { AccountsCard } from '@/components/dashboard/accounts-card'
import { TransactionsCard } from '@/components/dashboard/transactions-card'
import { BalanceEvolutionCard } from '@/components/dashboard/balance-evolution-card'
import { ExpensesByCategoryCard } from '@/components/dashboard/expenses-by-category-card'
import { FinancialCalendarCard } from '@/components/dashboard/financial-calendar-card'
import { TransactionForm } from '@/components/forms/transaction-form'
import { ManualAccountForm } from '@/components/forms/manual-account-form'

export default function Dashboard() {
  const {
    accounts,
    transactions,
    transactionsMeta,
    transactionPage,
    transactionsPageSize,
    loading,
    loadingTransactions,
    quickActions,
    quickAccessItems,
    connectDisabled,
    balanceData,
    categoryData,
    calendarData,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlyResult,
    upcomingPayments,
    isTransactionModalOpen,
    transactionFormData,
    loadingTransactionForm,
    savingTransaction,
    handleDeleteTransaction,
    manualAccountOptions,
    manualAccountModalOpen,
    savingManualAccount,
    handleOpenTransactionModal,
    closeTransactionModal,
    handleSubmitTransaction,
    closeManualAccountModal,
    handleSubmitManualAccount,
    handleConnect,
    handleTransactionsPageChange,
  } = useDashboardData()

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <KpiGrid
        loading={loading}
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpenses={monthlyExpenses}
        monthlyResult={monthlyResult}
      />

      <section id="upcoming-payments">
        <UpcomingPaymentsCard loading={loading} payments={upcomingPayments} />
      </section>

      <DashboardQuickActions actions={quickActions} />
      <DashboardQuickAccess items={quickAccessItems} />

      <div className="grid md:grid-cols-2 gap-6">
        <motion.section
          id="accounts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AccountsCard
            loading={loading}
            accounts={accounts}
            onConnect={handleConnect}
            disabled={connectDisabled}
          />
        </motion.section>

        <motion.section
          id="transactions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <TransactionsCard
            loading={loading || loadingTransactions}
            transactions={transactions}
            page={transactionsMeta?.page ?? transactionPage}
            pageSize={transactionsMeta?.pageSize ?? transactionsPageSize}
            totalCount={transactionsMeta?.totalCount ?? transactions.length}
            hasNextPage={Boolean(transactionsMeta?.hasNextPage)}
            hasPreviousPage={Boolean(transactionsMeta?.hasPreviousPage)}
            onPageChange={handleTransactionsPageChange}
            onEdit={handleOpenTransactionModal}
            onDelete={handleDeleteTransaction}
            onConnect={handleConnect}
            disabled={connectDisabled}
          />
        </motion.section>

        <motion.section
          id="balance-evolution"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <BalanceEvolutionCard loading={loading} data={balanceData} />
        </motion.section>

        <motion.section
          id="expenses-by-category"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ExpensesByCategoryCard loading={loading} data={categoryData} />
        </motion.section>
      </div>

      <motion.section
        id="financial-calendar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <FinancialCalendarCard loading={loading} days={calendarData} />
      </motion.section>

      {isTransactionModalOpen && (
        <TransactionForm
          transaction={transactionFormData ?? undefined}
          onSubmit={handleSubmitTransaction}
          onCancel={closeTransactionModal}
          onDelete={handleDeleteTransaction}
          loading={loadingTransactionForm}
          submitting={savingTransaction}
          manualAccounts={manualAccountOptions}
        />
      )}
      {manualAccountModalOpen && (
        <ManualAccountForm
          open={manualAccountModalOpen}
          account={null}
          onClose={closeManualAccountModal}
          onSubmit={handleSubmitManualAccount}
          submitting={savingManualAccount}
        />
      )}
    </motion.div>
  )
}
