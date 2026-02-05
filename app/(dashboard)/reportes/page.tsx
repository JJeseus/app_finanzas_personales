'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExpenseBarChart } from '@/components/charts-section'
import { EmptyState } from '@/components/empty-state'
import { useToast } from '@/hooks/use-toast'
import {
  transactionService,
  categoryService,
  accountService,
  formatCurrency,
  exportTransactionsToCSV,
} from '@/lib/data-service'
import type { Transaction, Category, Account, CategoryChartData } from '@/lib/types'
import {
  Download,
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthSummary {
  month: string
  monthDisplay: string
  income: number
  expenses: number
  savings: number
  transactionCount: number
}

interface CategorySummary {
  category: Category
  totalAmount: number
  transactionCount: number
  percentage: number
}

interface AccountSummary {
  account: Account
  income: number
  expenses: number
  balance: number
  transactionCount: number
}

export default function ReportesPage() {
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [monthlySummaries, setMonthlySummaries] = useState<MonthSummary[]>([])
  const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([])
  const [accountSummaries, setAccountSummaries] = useState<AccountSummary[]>([])

  useEffect(() => {
    setTransactions(transactionService.getAll())
    setCategories(categoryService.getAll())
    setAccounts(accountService.getAll())
  }, [])

  useEffect(() => {
    if (transactions.length === 0) return

    // Calculate monthly summaries
    const monthlyData: Record<string, MonthSummary> = {}
    
    for (let month = 0; month < 12; month++) {
      const monthKey = `${selectedYear}-${String(month + 1).padStart(2, '0')}`
      const date = new Date(parseInt(selectedYear), month)
      monthlyData[monthKey] = {
        month: monthKey,
        monthDisplay: date.toLocaleDateString('es-MX', { month: 'long' }),
        income: 0,
        expenses: 0,
        savings: 0,
        transactionCount: 0,
      }
    }

    transactions
      .filter((t) => t.date.startsWith(selectedYear) && t.status === 'confirmed')
      .forEach((t) => {
        const monthKey = t.date.slice(0, 7)
        if (monthlyData[monthKey]) {
          if (t.type === 'income') {
            monthlyData[monthKey].income += t.amount
          } else {
            monthlyData[monthKey].expenses += t.amount
          }
          monthlyData[monthKey].transactionCount++
        }
      })

    Object.values(monthlyData).forEach((m) => {
      m.savings = m.income - m.expenses
    })

    setMonthlySummaries(Object.values(monthlyData))

    // Calculate category summaries
    const categoryData: Record<string, { total: number; count: number }> = {}
    let totalExpenses = 0

    transactions
      .filter((t) => t.type === 'expense' && t.date.startsWith(selectedYear) && t.status === 'confirmed')
      .forEach((t) => {
        if (!categoryData[t.categoryId]) {
          categoryData[t.categoryId] = { total: 0, count: 0 }
        }
        categoryData[t.categoryId].total += t.amount
        categoryData[t.categoryId].count++
        totalExpenses += t.amount
      })

    const catSummaries: CategorySummary[] = Object.entries(categoryData)
      .map(([categoryId, data]) => {
        const category = categories.find((c) => c.id === categoryId)
        return {
          category: category || { id: categoryId, name: 'Desconocido', type: 'expense', icon: '', color: '#64748b' },
          totalAmount: data.total,
          transactionCount: data.count,
          percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
        }
      })
      .sort((a, b) => b.totalAmount - a.totalAmount)

    setCategorySummaries(catSummaries)

    // Calculate account summaries
    const accountData: Record<string, { income: number; expenses: number; count: number }> = {}

    transactions
      .filter((t) => t.date.startsWith(selectedYear) && t.status === 'confirmed')
      .forEach((t) => {
        if (!accountData[t.accountId]) {
          accountData[t.accountId] = { income: 0, expenses: 0, count: 0 }
        }
        if (t.type === 'income') {
          accountData[t.accountId].income += t.amount
        } else {
          accountData[t.accountId].expenses += t.amount
        }
        accountData[t.accountId].count++
      })

    const accSummaries: AccountSummary[] = accounts.map((account) => {
      const data = accountData[account.id] || { income: 0, expenses: 0, count: 0 }
      return {
        account,
        income: data.income,
        expenses: data.expenses,
        balance: accountService.getBalance(account.id),
        transactionCount: data.count,
      }
    })

    setAccountSummaries(accSummaries)
  }, [transactions, categories, accounts, selectedYear])

  const handleExportCSV = () => {
    const yearTransactions = transactions.filter((t) => t.date.startsWith(selectedYear))
    const csv = exportTransactionsToCSV(yearTransactions)
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `movimientos_${selectedYear}.csv`
    link.click()
    
    toast({
      title: 'Exportación completada',
      description: `Se exportaron ${yearTransactions.length} movimientos.`,
    })
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString())

  const totalIncome = monthlySummaries.reduce((sum, m) => sum + m.income, 0)
  const totalExpenses = monthlySummaries.reduce((sum, m) => sum + m.expenses, 0)
  const totalSavings = totalIncome - totalExpenses

  const categoryChartData: CategoryChartData[] = categorySummaries.slice(0, 8).map((cs) => ({
    category: cs.category.name,
    amount: cs.totalAmount,
    color: cs.category.color,
  }))

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Análisis detallado de tus finanzas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2 bg-transparent w-full sm:w-auto">
            <Download className="h-4 w-4" />
            <span className="sm:inline">Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Year Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-income/10 shrink-0">
              <ArrowUpCircle className="h-5 w-5 sm:h-6 sm:w-6 text-income" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ingresos {selectedYear}</p>
              <p className="text-lg sm:text-2xl font-bold text-income truncate">{formatCurrency(totalIncome)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-expense/10 shrink-0">
              <ArrowDownCircle className="h-5 w-5 sm:h-6 sm:w-6 text-expense" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Gastos {selectedYear}</p>
              <p className="text-lg sm:text-2xl font-bold text-expense truncate">{formatCurrency(totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
            <div className={cn(
              'flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg shrink-0',
              totalSavings >= 0 ? 'bg-income/10' : 'bg-expense/10'
            )}>
              {totalSavings >= 0 ? (
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-income" />
              ) : (
                <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-expense" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Ahorro {selectedYear}</p>
              <p className={cn(
                'text-lg sm:text-2xl font-bold truncate',
                totalSavings >= 0 ? 'text-income' : 'text-expense'
              )}>
                {formatCurrency(totalSavings)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monthly" className="flex flex-col gap-4">
        <TabsList className="w-full sm:w-fit grid grid-cols-3 sm:flex">
          <TabsTrigger value="monthly" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Por </span>Mes
          </TabsTrigger>
          <TabsTrigger value="category" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Por </span>Categoría
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1 sm:gap-2 text-xs sm:text-sm">
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Por </span>Cuenta
          </TabsTrigger>
        </TabsList>

        {/* Monthly Tab */}
        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Resumen Mensual {selectedYear}</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlySummaries.some((m) => m.transactionCount > 0) ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mes</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Ahorro</TableHead>
                        <TableHead className="text-right">Movimientos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlySummaries.map((summary) => (
                        <TableRow key={summary.month}>
                          <TableCell className="font-medium capitalize">
                            {summary.monthDisplay}
                          </TableCell>
                          <TableCell className="text-right text-income">
                            {formatCurrency(summary.income)}
                          </TableCell>
                          <TableCell className="text-right text-expense">
                            {formatCurrency(summary.expenses)}
                          </TableCell>
                          <TableCell className={cn(
                            'text-right font-medium',
                            summary.savings >= 0 ? 'text-income' : 'text-expense'
                          )}>
                            {formatCurrency(summary.savings)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {summary.transactionCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="Sin datos"
                  description={`No hay movimientos registrados para ${selectedYear}.`}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Tab */}
        <TabsContent value="category">
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpenseBarChart data={categoryChartData} title="Gastos por Categoría" />
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-medium">Detalle por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {categorySummaries.length > 0 ? (
                  <div className="flex flex-col divide-y divide-border">
                    {categorySummaries.map((summary) => (
                      <div
                        key={summary.category.id}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${summary.category.color}20` }}
                          >
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: summary.category.color }}
                            />
                          </div>
                          <div>
                            <p className="font-medium">{summary.category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {summary.transactionCount} movimientos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(summary.totalAmount)}</p>
                          <Badge variant="secondary" className="font-normal">
                            {summary.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={BarChart3}
                    title="Sin datos"
                    description={`No hay gastos registrados para ${selectedYear}.`}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Resumen por Cuenta</CardTitle>
            </CardHeader>
            <CardContent>
              {accountSummaries.some((a) => a.transactionCount > 0) ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cuenta</TableHead>
                        <TableHead className="text-right">Ingresos</TableHead>
                        <TableHead className="text-right">Gastos</TableHead>
                        <TableHead className="text-right">Saldo Actual</TableHead>
                        <TableHead className="text-right">Movimientos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountSummaries.map((summary) => (
                        <TableRow key={summary.account.id}>
                          <TableCell className="font-medium">
                            {summary.account.name}
                          </TableCell>
                          <TableCell className="text-right text-income">
                            {formatCurrency(summary.income)}
                          </TableCell>
                          <TableCell className="text-right text-expense">
                            {formatCurrency(summary.expenses)}
                          </TableCell>
                          <TableCell className={cn(
                            'text-right font-medium',
                            summary.balance >= 0 ? 'text-foreground' : 'text-expense'
                          )}>
                            {formatCurrency(summary.balance)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {summary.transactionCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  icon={BarChart3}
                  title="Sin datos"
                  description={`No hay movimientos registrados para ${selectedYear}.`}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
