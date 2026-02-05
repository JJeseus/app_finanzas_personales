// Data models for the finance tracker

export type TransactionType = 'income' | 'expense'
export type TransactionStatus = 'confirmed' | 'pending'
export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'otro'
export type AccountType = 'cash' | 'bank' | 'card'
export type CategoryType = 'income' | 'expense' | 'both'

export interface Transaction {
  id: string
  date: string // ISO date string
  type: TransactionType
  amount: number
  currency: string
  categoryId: string
  accountId: string
  method: PaymentMethod
  description: string
  tags: string[]
  status: TransactionStatus
  createdAt: string // ISO date string
}

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  color: string
}

export interface Account {
  id: string
  name: string
  type: AccountType
  initialBalance: number
  notes: string
}

export interface Budget {
  id: string
  month: string // YYYY-MM format
  categoryId: string
  limitAmount: number
}

// Credit/Loan types
export type CreditStatus = 'active' | 'paid' | 'overdue'
export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly' | 'yearly'

export interface Credit {
  id: string
  name: string
  totalAmount: number
  remainingAmount: number
  interestRate: number // percentage
  monthlyPayment: number
  startDate: string // ISO date string
  endDate: string // ISO date string
  nextPaymentDate: string // ISO date string
  frequency: PaymentFrequency
  status: CreditStatus
  notes: string
  createdAt: string // ISO date string
}

export interface CreditPayment {
  id: string
  creditId: string
  amount: number
  date: string // ISO date string
  status: 'paid' | 'pending' | 'overdue'
  notes: string
}

// Filter types
export interface TransactionFilters {
  startDate?: string
  endDate?: string
  type?: TransactionType
  categoryId?: string
  accountId?: string
  method?: PaymentMethod
  tags?: string[]
  minAmount?: number
  maxAmount?: number
  searchText?: string
  status?: TransactionStatus
}

// Dashboard stats
export interface DashboardStats {
  currentBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlySavings: number
}

// Chart data types
export interface CategoryChartData {
  category: string
  amount: number
  color: string
}

export interface MonthlyFlowData {
  month: string
  income: number
  expenses: number
}
