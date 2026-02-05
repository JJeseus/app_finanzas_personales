'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/kpi-card'
import { ChartsSection } from '@/components/charts-section'
import { TransactionFormModal } from '@/components/transaction-form-modal'
import { FloatingActionButton } from '@/components/floating-action-button'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/hooks/use-toast'
import {
  dashboardService,
  transactionService,
  categoryService,
  accountService,
  formatCurrency,
  formatDate,
} from '@/lib/data-service'
import type { Transaction, Category, Account, DashboardStats, CategoryChartData, MonthlyFlowData } from '@/lib/types'
import { ArrowUpCircle, ArrowDownCircle, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats>({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
  })
  const [categoryData, setCategoryData] = useState<CategoryChartData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyFlowData[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadData = () => {
    setStats(dashboardService.getStats())
    setCategoryData(dashboardService.getCategoryChartData())
    setMonthlyData(dashboardService.getMonthlyFlowData())
    setRecentTransactions(transactionService.getRecent(10))
    setCategories(categoryService.getAll())
    setAccounts(accountService.getAll())
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateTransaction = (data: Omit<Transaction, 'id' | 'createdAt'>) => {
    transactionService.create(data)
    loadData()
    toast({
      title: 'Movimiento creado',
      description: 'El movimiento se ha registrado correctamente.',
    })
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || 'Sin categoría'
  }

  const getCategoryColor = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.color || '#64748b'
  }

  const getAccountName = (accountId: string) => {
    return accounts.find((a) => a.id === accountId)?.name || 'Sin cuenta'
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen de tus finanzas personales
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Saldo Actual"
          value={formatCurrency(stats.currentBalance)}
          icon="balance"
        />
        <KPICard
          title="Ingresos del Mes"
          value={formatCurrency(stats.monthlyIncome)}
          icon="income"
          trend="up"
        />
        <KPICard
          title="Gastos del Mes"
          value={formatCurrency(stats.monthlyExpenses)}
          icon="expense"
          trend="down"
        />
        <KPICard
          title="Ahorro del Mes"
          value={formatCurrency(stats.monthlySavings)}
          icon="savings"
          trend={stats.monthlySavings >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Charts */}
      <ChartsSection categoryData={categoryData} monthlyData={monthlyData} />

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">Últimos Movimientos</CardTitle>
          <Badge variant="secondary" className="font-normal">
            {recentTransactions.length} movimientos
          </Badge>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="flex flex-col divide-y divide-border">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        transaction.type === 'income'
                          ? 'bg-income/10 text-income'
                          : 'bg-expense/10 text-expense'
                      )}
                    >
                      {transaction.type === 'income' ? (
                        <ArrowUpCircle className="h-5 w-5" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {transaction.description || getCategoryName(transaction.categoryId)}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span
                          className="inline-flex h-2 w-2 rounded-full"
                          style={{ backgroundColor: getCategoryColor(transaction.categoryId) }}
                        />
                        <span>{getCategoryName(transaction.categoryId)}</span>
                        <span>·</span>
                        <span>{getAccountName(transaction.accountId)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        'font-semibold',
                        transaction.type === 'income' ? 'text-income' : 'text-expense'
                      )}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={ArrowLeftRight}
              title="Sin movimientos"
              description="Aún no tienes movimientos registrados. Comienza agregando tu primer ingreso o gasto."
            />
          )}
        </CardContent>
      </Card>

      {/* FAB */}
      <FloatingActionButton onClick={() => setIsModalOpen(true)} />

      {/* Transaction Modal */}
      <TransactionFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleCreateTransaction}
      />
    </div>
  )
}
