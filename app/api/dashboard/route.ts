import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { dbMethodToUi } from "@/lib/db-mappers"

export async function GET() {
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7)

  // 1) Accounts + saldo total (usando balance como saldo inicial + tx confirmadas)
  const accounts = await sql`
    select id, name, type, balance, color, notes
    from accounts
    order by name asc
  `

  const tx = await sql`
    select id, date, type, amount, currency, category_id, account_id, method, status, description, tags, created_at
    from transactions
    where status = 'confirmed'
  `

  // currentBalance = suma por cuenta: initialBalance + sum(tx)
  const balanceByAccount: Record<string, number> = {}
  for (const a of accounts as any[]) {
    balanceByAccount[a.id] = Number(a.balance ?? 0)
  }
  for (const t of tx as any[]) {
    const accId = t.account_id
    if (!balanceByAccount[accId]) balanceByAccount[accId] = 0
    balanceByAccount[accId] += t.type === "income" ? Number(t.amount) : -Number(t.amount)
  }
  const currentBalance = Object.values(balanceByAccount).reduce((s, v) => s + v, 0)

  // 2) Monthly income/expenses
  const monthly = (tx as any[]).filter(t => String(t.date).startsWith(currentMonth))
  const monthlyIncome = monthly.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
  const monthlyExpenses = monthly.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)

  const stats = {
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    monthlySavings: monthlyIncome - monthlyExpenses,
  }

  // 3) Categories para chart
  const categories = await sql`
    select id, name, type, color
    from categories
    order by name asc
  `

  // expenses por categoría del mes
  const expensesByCat: Record<string, number> = {}
  for (const t of monthly) {
    if (t.type !== "expense") continue
    const catId = t.category_id
    expensesByCat[catId] = (expensesByCat[catId] || 0) + Number(t.amount)
  }

  const categoryData = Object.entries(expensesByCat)
    .map(([categoryId, amount]) => {
      const cat = (categories as any[]).find(c => c.id === categoryId)
      return { category: cat?.name || "Desconocido", amount, color: cat?.color || "#64748b" }
    })
    .sort((a, b) => b.amount - a.amount)

  // 4) Monthly flow (últimos 6 meses)
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.toISOString().slice(0, 7))
  }
  const monthlyFlowData = months.map(m => {
    const list = (tx as any[]).filter(t => String(t.date).startsWith(m))
    const income = list.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0)
    const expenses = list.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0)
    const [y, mm] = m.split("-")
    const label = new Date(Number(y), Number(mm) - 1).toLocaleDateString("es-MX", { month: "short" })
    return { month: label, income, expenses }
  })

  // 5) Recent tx (10)
  const recentRows = await sql`
    select id, date, type, amount, currency, category_id, account_id, method, status, description, tags, created_at
    from transactions
    order by date desc, created_at desc
    limit 10
  `

  const recentTransactions = (recentRows as any[]).map(r => ({
    id: r.id,
    date: new Date(r.date).toISOString().slice(0, 10),
    type: r.type,
    amount: Number(r.amount),
    currency: r.currency ?? "MXN",
    categoryId: r.category_id,
    accountId: r.account_id,
    method: dbMethodToUi(r.method),
    description: r.description ?? "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }))

  return NextResponse.json({
    stats,
    categoryData,
    monthlyData: monthlyFlowData,
    recentTransactions,
    categories: (categories as any[]).map(c => ({ id: c.id, name: c.name, type: c.type, color: c.color })),
    accounts: (accounts as any[]).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      initialBalance: Number(a.balance ?? 0),
      color: a.color ?? "#64748b",
      notes: a.notes ?? "",
    })),
  })
}
