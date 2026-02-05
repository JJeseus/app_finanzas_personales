import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function toMonth(v: any) {
  const s = String(v ?? "").trim()
  // esperado: YYYY-MM
  return /^\d{4}-\d{2}$/.test(s) ? s : ""
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const month = toMonth(searchParams.get("month"))

  const rows = month
    ? await sql`
        select id, month, category_id, limit_amount
        from budgets
        where month = ${month}
        order by created_at desc
      `
    : await sql`
        select id, month, category_id, limit_amount
        from budgets
        order by created_at desc
      `

  const mapped = (rows as any[]).map((b) => ({
    id: b.id,
    month: b.month,
    categoryId: b.category_id,
    limitAmount: Number(b.limit_amount ?? 0),
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    const month = toMonth(body?.month)
    const categoryId = String(body?.categoryId ?? "").trim()
    const limitAmount = Number(body?.limitAmount ?? 0)

    if (!month) return NextResponse.json({ error: "month requerido (YYYY-MM)" }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: "categoryId requerido" }, { status: 400 })
    if (!Number.isFinite(limitAmount) || limitAmount <= 0) {
      return NextResponse.json({ error: "limitAmount inválido" }, { status: 400 })
    }

    const rows = await sql`
      insert into budgets (id, month, category_id, limit_amount)
      values (gen_random_uuid()::text, ${month}, ${categoryId}, ${limitAmount})
      returning id, month, category_id, limit_amount
    `

    const b: any = rows[0]
    return NextResponse.json(
      {
        id: b.id,
        month: b.month,
        categoryId: b.category_id,
        limitAmount: Number(b.limit_amount ?? 0),
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error("POST /api/budgets ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al crear presupuesto" }, { status: 500 })
  }
}
