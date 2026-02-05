import type { Transaction, Category, Account, Budget, Credit, CreditPayment } from './types'

export const demoCategories: Category[] = [
  { id: 'cat-1', name: 'Salario', type: 'income', icon: 'Wallet', color: '#10b981' },
  { id: 'cat-2', name: 'Freelance', type: 'income', icon: 'Laptop', color: '#06b6d4' },
  { id: 'cat-3', name: 'Inversiones', type: 'income', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'cat-4', name: 'Alimentos', type: 'expense', icon: 'ShoppingCart', color: '#f59e0b' },
  { id: 'cat-5', name: 'Transporte', type: 'expense', icon: 'Car', color: '#ef4444' },
  { id: 'cat-6', name: 'Entretenimiento', type: 'expense', icon: 'Film', color: '#ec4899' },
  { id: 'cat-7', name: 'Servicios', type: 'expense', icon: 'Zap', color: '#6366f1' },
  { id: 'cat-8', name: 'Salud', type: 'expense', icon: 'Heart', color: '#14b8a6' },
  { id: 'cat-9', name: 'Educación', type: 'expense', icon: 'BookOpen', color: '#f97316' },
  { id: 'cat-10', name: 'Ropa', type: 'expense', icon: 'Shirt', color: '#a855f7' },
  { id: 'cat-11', name: 'Hogar', type: 'expense', icon: 'Home', color: '#0ea5e9' },
  { id: 'cat-12', name: 'Otros', type: 'both', icon: 'MoreHorizontal', color: '#64748b' },
]

export const demoAccounts: Account[] = [
  { id: 'acc-1', name: 'Efectivo', type: 'cash', initialBalance: 5000, notes: 'Cartera personal' },
  { id: 'acc-2', name: 'BBVA Nómina', type: 'bank', initialBalance: 25000, notes: 'Cuenta principal' },
  { id: 'acc-3', name: 'Santander Ahorro', type: 'bank', initialBalance: 50000, notes: 'Fondo de emergencia' },
  { id: 'acc-4', name: 'Tarjeta Oro', type: 'card', initialBalance: 0, notes: 'Crédito disponible: $30,000' },
]

const generateTransactions = (): Transaction[] => {
  const transactions: Transaction[] = []
  const now = new Date()
  
  // Generate transactions for the last 6 months
  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    const currentMonth = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
    
    // Add salary at the beginning of each month
    transactions.push({
      id: `trans-salary-${monthOffset}`,
      date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString(),
      type: 'income',
      amount: 35000,
      currency: 'MXN',
      categoryId: 'cat-1',
      accountId: 'acc-2',
      method: 'transferencia',
      description: 'Salario mensual',
      tags: ['nómina', 'trabajo'],
      status: 'confirmed',
      createdAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString(),
    })
    
    // Add some random expenses throughout the month
    const expenseData = [
      { cat: 'cat-4', desc: 'Supermercado', min: 800, max: 2500, tags: ['comida', 'hogar'] },
      { cat: 'cat-5', desc: 'Gasolina', min: 500, max: 1200, tags: ['auto'] },
      { cat: 'cat-6', desc: 'Netflix/Spotify', min: 200, max: 400, tags: ['streaming'] },
      { cat: 'cat-7', desc: 'Luz y agua', min: 600, max: 1500, tags: ['servicios', 'hogar'] },
      { cat: 'cat-8', desc: 'Farmacia', min: 200, max: 800, tags: ['salud'] },
      { cat: 'cat-11', desc: 'Artículos para casa', min: 300, max: 1500, tags: ['hogar'] },
      { cat: 'cat-4', desc: 'Restaurante', min: 300, max: 1200, tags: ['comida', 'salida'] },
      { cat: 'cat-6', desc: 'Cine', min: 150, max: 400, tags: ['entretenimiento', 'salida'] },
    ]
    
    expenseData.forEach((expense, index) => {
      const day = Math.floor(Math.random() * 28) + 1
      const amount = Math.floor(Math.random() * (expense.max - expense.min)) + expense.min
      transactions.push({
        id: `trans-exp-${monthOffset}-${index}`,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString(),
        type: 'expense',
        amount,
        currency: 'MXN',
        categoryId: expense.cat,
        accountId: Math.random() > 0.5 ? 'acc-2' : 'acc-4',
        method: Math.random() > 0.3 ? 'tarjeta' : 'efectivo',
        description: expense.desc,
        tags: expense.tags,
        status: Math.random() > 0.1 ? 'confirmed' : 'pending',
        createdAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString(),
      })
    })
    
    // Add some freelance income occasionally
    if (Math.random() > 0.5) {
      transactions.push({
        id: `trans-freelance-${monthOffset}`,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15).toISOString(),
        type: 'income',
        amount: Math.floor(Math.random() * 8000) + 3000,
        currency: 'MXN',
        categoryId: 'cat-2',
        accountId: 'acc-2',
        method: 'transferencia',
        description: 'Proyecto freelance',
        tags: ['freelance', 'extra'],
        status: 'confirmed',
        createdAt: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15).toISOString(),
      })
    }
  }
  
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const demoTransactions: Transaction[] = generateTransactions()

export const demoBudgets: Budget[] = [
  { id: 'budget-1', month: new Date().toISOString().slice(0, 7), categoryId: 'cat-4', limitAmount: 8000 },
  { id: 'budget-2', month: new Date().toISOString().slice(0, 7), categoryId: 'cat-5', limitAmount: 3000 },
  { id: 'budget-3', month: new Date().toISOString().slice(0, 7), categoryId: 'cat-6', limitAmount: 2000 },
  { id: 'budget-4', month: new Date().toISOString().slice(0, 7), categoryId: 'cat-7', limitAmount: 2500 },
  { id: 'budget-5', month: new Date().toISOString().slice(0, 7), categoryId: 'cat-11', limitAmount: 3000 },
]

// Demo credits/loans
const now = new Date()
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15)
const in3Months = new Date(now.getFullYear(), now.getMonth() + 3, 1)
const in2Years = new Date(now.getFullYear() + 2, now.getMonth(), 1)
const in5Years = new Date(now.getFullYear() + 5, now.getMonth(), 1)

export const demoCredits: Credit[] = [
  {
    id: 'credit-1',
    name: 'Crédito Automotriz',
    totalAmount: 250000,
    remainingAmount: 180000,
    interestRate: 12.5,
    monthlyPayment: 5800,
    startDate: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString(),
    endDate: in5Years.toISOString(),
    nextPaymentDate: nextMonth.toISOString(),
    frequency: 'monthly',
    status: 'active',
    notes: 'Crédito BBVA para auto Honda Civic 2023',
    createdAt: new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString(),
  },
  {
    id: 'credit-2',
    name: 'Tarjeta de Crédito Oro',
    totalAmount: 15000,
    remainingAmount: 8500,
    interestRate: 36,
    monthlyPayment: 2500,
    startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(),
    endDate: in3Months.toISOString(),
    nextPaymentDate: new Date(now.getFullYear(), now.getMonth(), 25).toISOString(),
    frequency: 'monthly',
    status: 'active',
    notes: 'Deuda de tarjeta - pagar lo antes posible',
    createdAt: new Date(now.getFullYear(), now.getMonth() - 2, 15).toISOString(),
  },
  {
    id: 'credit-3',
    name: 'Préstamo Personal',
    totalAmount: 50000,
    remainingAmount: 35000,
    interestRate: 18,
    monthlyPayment: 3200,
    startDate: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString(),
    endDate: in2Years.toISOString(),
    nextPaymentDate: nextMonth.toISOString(),
    frequency: 'monthly',
    status: 'active',
    notes: 'Préstamo para remodelación del hogar',
    createdAt: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString(),
  },
]

// Generate payment schedule for credits
const generateCreditPayments = (): CreditPayment[] => {
  const payments: CreditPayment[] = []
  
  demoCredits.forEach(credit => {
    const startDate = new Date(credit.startDate)
    const now = new Date()
    
    // Generate past payments (marked as paid)
    let paymentDate = new Date(startDate)
    let paymentIndex = 0
    
    while (paymentDate < now && paymentIndex < 24) {
      payments.push({
        id: `payment-${credit.id}-${paymentIndex}`,
        creditId: credit.id,
        amount: credit.monthlyPayment,
        date: paymentDate.toISOString(),
        status: 'paid',
        notes: `Pago ${paymentIndex + 1}`,
      })
      
      paymentDate = new Date(paymentDate.getFullYear(), paymentDate.getMonth() + 1, paymentDate.getDate())
      paymentIndex++
    }
    
    // Generate upcoming payments (marked as pending)
    for (let i = 0; i < 6; i++) {
      const futureDate = new Date(now.getFullYear(), now.getMonth() + i, parseInt(credit.nextPaymentDate.slice(8, 10)))
      if (futureDate > now) {
        payments.push({
          id: `payment-${credit.id}-future-${i}`,
          creditId: credit.id,
          amount: credit.monthlyPayment,
          date: futureDate.toISOString(),
          status: 'pending',
          notes: `Pago programado`,
        })
      }
    }
  })
  
  return payments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export const demoCreditPayments: CreditPayment[] = generateCreditPayments()
