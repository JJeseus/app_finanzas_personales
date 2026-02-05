import type {
  Transaction,
  Category,
  Account,
  Budget,
  Credit,
  CreditPayment,
  TransactionFilters,
  DashboardStats,
  CategoryChartData,
  MonthlyFlowData,
} from "./types";

// Helper fetch
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Transactions
export const transactionService = {
  getAll: async (): Promise<Transaction[]> => api("/api/transactions"),

  create: async (transaction: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> =>
    api("/api/transactions", { method: "POST", body: JSON.stringify(transaction) }),

  update: async (id: string, updates: Partial<Transaction>): Promise<Transaction> =>
    api(`/api/transactions/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  delete: async (id: string): Promise<boolean> => {
    await api(`/api/transactions/${id}`, { method: "DELETE" });
    return true;
  },
  
  getRecent: async (limit: number = 10): Promise<Transaction[]> => {
  const all = await transactionService.getAll()
  return all
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
},

  filterLocal: (transactions: Transaction[], filters: TransactionFilters): Transaction[] => {
    let t = [...transactions];

    if (filters.startDate) t = t.filter(x => x.date >= filters.startDate!);
    if (filters.endDate) t = t.filter(x => x.date <= filters.endDate!);
    if (filters.type) t = t.filter(x => x.type === filters.type);
    if (filters.categoryId) t = t.filter(x => x.categoryId === filters.categoryId);
    if (filters.accountId) t = t.filter(x => x.accountId === filters.accountId);
    if (filters.method) t = t.filter(x => x.method === filters.method);
    if (filters.status) t = t.filter(x => x.status === filters.status);
    if (filters.minAmount !== undefined) t = t.filter(x => x.amount >= filters.minAmount!);
    if (filters.maxAmount !== undefined) t = t.filter(x => x.amount <= filters.maxAmount!);
    if (filters.tags?.length) t = t.filter(x => filters.tags!.some(tag => x.tags.includes(tag)));
    if (filters.searchText) {
      const s = filters.searchText.toLowerCase();
      t = t.filter(x => x.description.toLowerCase().includes(s) || x.tags.some(tag => tag.toLowerCase().includes(s)));
    }
    return t.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
};

// Categories
// Categories
// Categories
export const categoryService = {
  getAll: async (): Promise<Category[]> => api("/api/categories"),

  create: async (payload: Omit<Category, "id">): Promise<Category> =>
    api("/api/categories", { method: "POST", body: JSON.stringify(payload) }),

  update: async (id: string, updates: Partial<Omit<Category, "id">>): Promise<Category> =>
    api(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  delete: async (id: string): Promise<boolean> => {
    await api(`/api/categories/${id}`, { method: "DELETE" })
    return true
  },
}



// Accounts
export const accountService = {
  getAll: async (): Promise<Account[]> => api("/api/accounts"),

  create: async (payload: Omit<Account, "id" | "createdAt">): Promise<Account> =>
    api("/api/accounts", { method: "POST", body: JSON.stringify(payload) }),

  update: async (id: string, updates: Partial<Account>): Promise<Account> =>
    api(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  delete: async (id: string): Promise<boolean> => {
    await api(`/api/accounts/${id}`, { method: "DELETE" })
    return true
  },

  getBalance: async (accountId: string): Promise<number> => {
    const accounts = await accountService.getAll();
    const account = accounts.find(a => a.id === accountId);
    if (!account) return 0;

    const transactions = await transactionService.getAll();
    const accountTx = transactions.filter(t => t.accountId === accountId && t.status === "confirmed");

    let balance = account.initialBalance;
    for (const t of accountTx) {
      balance += t.type === "income" ? t.amount : -t.amount;
    }
    return balance;
  },

  getTotalBalance: async (): Promise<number> => {
    const accounts = await accountService.getAll();
    const balances = await Promise.all(accounts.map(a => accountService.getBalance(a.id)));
    return balances.reduce((sum, b) => sum + b, 0);
  },
};

// Dashboard (igual que antes, pero async)
export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const transactions = await transactionService.getAll();

    const monthly = transactions.filter(t => t.date.startsWith(currentMonth) && t.status === "confirmed");
    const monthlyIncome = monthly.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const monthlyExpenses = monthly.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    return {
      currentBalance: await accountService.getTotalBalance(),
      monthlyIncome,
      monthlyExpenses,
      monthlySavings: monthlyIncome - monthlyExpenses,
    };
  },

  getCategoryChartData: async (): Promise<CategoryChartData[]> => {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const [transactions, categories] = await Promise.all([transactionService.getAll(), categoryService.getAll()]);

    const expensesByCat: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "expense" || t.status !== "confirmed" || !t.date.startsWith(currentMonth)) continue;
      expensesByCat[t.categoryId] = (expensesByCat[t.categoryId] || 0) + t.amount;
    }

    return Object.entries(expensesByCat)
      .map(([categoryId, amount]) => {
        const cat = categories.find(c => c.id === categoryId);
        return { category: cat?.name || "Desconocido", amount, color: (cat as any)?.color || "#64748b" };
      })
      .sort((a, b) => b.amount - a.amount);
  },

  getMonthlyFlowData: async (): Promise<MonthlyFlowData[]> => {
    const transactions = await transactionService.getAll();
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = d.toISOString().slice(0, 7);
      monthlyData[k] = { income: 0, expenses: 0 };
    }

    for (const t of transactions) {
      if (t.status !== "confirmed") continue;
      const k = t.date.slice(0, 7);
      if (!monthlyData[k]) continue;
      if (t.type === "income") monthlyData[k].income += t.amount;
      else monthlyData[k].expenses += t.amount;
    }

    return Object.entries(monthlyData).map(([month, data]) => ({
      month: formatMonth(month),
      income: data.income,
      expenses: data.expenses,
    }));
  },
};

// Utilidades (puedes dejar las tuyas tal cual)
export function formatCurrency(amount: number, currency: string = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMonth(monthString: string): string {
  const [year, month] = monthString.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("es-MX", { month: "short" });
}

export function formatDate(dateString: string): string {
  // Tu UI suele manejar 'YYYY-MM-DD'
  // Esto asegura que se muestre bien en es-MX
  return new Date(dateString).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const dashboardApiService = {
  getAll: async (): Promise<{
    stats: DashboardStats
    categoryData: CategoryChartData[]
    monthlyData: MonthlyFlowData[]
    recentTransactions: Transaction[]
    categories: Category[]
    accounts: Account[]
  }> => api("/api/dashboard"),
}

// Credits
export const creditService = {
  getAll: async (): Promise<Credit[]> => api("/api/credits"),

  create: async (credit: Omit<Credit, "id" | "createdAt">): Promise<Credit> =>
    api("/api/credits", { method: "POST", body: JSON.stringify(credit) }),

  update: async (id: string, updates: Partial<Credit>): Promise<Credit> =>
    api(`/api/credits/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  delete: async (id: string): Promise<boolean> => {
    await api(`/api/credits/${id}`, { method: "DELETE" })
    return true
  },

  // (Opcional) útil si alguna pantalla lo necesita
  getById: async (id: string): Promise<Credit | null> => {
    const all = await creditService.getAll()
    return all.find(c => c.id === id) ?? null
  },
}

// Credit Payments
export const creditPaymentService = {
  getAll: async (): Promise<CreditPayment[]> => api("/api/credit-payments"),

  // Recomendado: filtrar pagos por crédito desde API
  getByCreditId: async (creditId: string): Promise<CreditPayment[]> =>
    api(`/api/credit-payments?creditId=${encodeURIComponent(creditId)}`),

  // ✅ registrar un pago (solo inserta en credit_payments; NO recomendado para “pagar” real)
  create: async (payment: Omit<CreditPayment, "id" | "createdAt">): Promise<CreditPayment> =>
    api("/api/credit-payments", { method: "POST", body: JSON.stringify(payment) }),

  update: async (id: string, updates: Partial<CreditPayment>): Promise<CreditPayment> =>
    api(`/api/credit-payments/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  delete: async (id: string): Promise<boolean> => {
    await api(`/api/credit-payments/${id}`, { method: "DELETE" })
    return true
  },

  // ✅ NUEVO: pagar bien (credit_payments + transactions + update credits)
  pay: async (payload: {
    creditId: string
    amount: number
    date: string // YYYY-MM-DD
    accountId: string
    method: string // ideal: 'cash' | 'card' | 'transfer' | 'other' (o lo que soporte tu mapper)
    categoryId: string
    notes?: string
    currency?: string
    description?: string
    tags?: string[]
  }): Promise<{
    payment: CreditPayment
    transactionId: string
    credit: { remainingAmount: number; nextPaymentDate: string; status: string }
  }> =>
    api("/api/credit-payments/pay", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // 🚫 DEPRECADO: no lo uses para pagos reales (no crea transaction ni descuenta cuenta)
  // markAsPaid: async (id: string): Promise<CreditPayment> =>
  //   api(`/api/credit-payments/${id}`, { method: "PUT", body: JSON.stringify({ status: "paid" }) }),
}


// Budgets
export const budgetService = {
  getAll: async (): Promise<Budget[]> => api("/api/budgets"),

  getByMonth: async (month: string): Promise<Budget[]> =>
    api(`/api/budgets?month=${encodeURIComponent(month)}`),

  create: async (payload: Omit<Budget, "id">): Promise<Budget> =>
    api("/api/budgets", { method: "POST", body: JSON.stringify(payload) }),

  update: async (id: string, updates: Partial<Budget>): Promise<Budget> =>
    api(`/api/budgets/${id}`, { method: "PUT", body: JSON.stringify(updates) }),

  delete: async (id: string): Promise<boolean> => {
    await api(`/api/budgets/${id}`, { method: "DELETE" })
    return true
  },
  

  // Gasto real por categoría/mes (lo sacamos de transactions)
  getSpentAmount: async (categoryId: string, month: string): Promise<number> => {
    const tx = await transactionService.getAll()
    return tx
      .filter(t =>
        t.type === "expense" &&
        t.status === "confirmed" &&
        t.categoryId === categoryId &&
        t.date.startsWith(month)
      )
      .reduce((s, t) => s + t.amount, 0)
  },
  getMonthlyBalance: async (month: string): Promise<{
    month: string
    income: number
    budgeted: number
    spent: number
    remainingFromIncome: number
    remainingFromBudget: number
    coveragePct: number
    spentPctOfIncome: number
  }> => {
    const [tx, budgets] = await Promise.all([
      transactionService.getAll(),
      budgetService.getByMonth(month),
    ])

    const income = tx
      .filter(t => t.status === "confirmed" && t.type === "income" && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0)

    const spent = tx
      .filter(t => t.status === "confirmed" && t.type === "expense" && t.date.startsWith(month))
      .reduce((s, t) => s + t.amount, 0)

    const budgeted = budgets.reduce((s, b) => s + b.limitAmount, 0)

    const remainingFromIncome = income - budgeted         // ✅ “¿me alcanza lo presupuestado con lo que gano?”
    const remainingFromBudget = budgeted - spent          // ✅ “¿me queda presupuesto disponible?”

    const coveragePct = income > 0 ? (budgeted / income) * 100 : 0
    const spentPctOfIncome = income > 0 ? (spent / income) * 100 : 0

    return {
      month,
      income,
      budgeted,
      spent,
      remainingFromIncome,
      remainingFromBudget,
      coveragePct,
      spentPctOfIncome,
    }
  },
}

