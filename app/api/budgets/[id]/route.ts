import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

type Ctx = { params: Promise<{ id: string }> }

function toMonth(v: any) {
  const s = String(v ?? "").trim()
  return /^\d{4}-\d{2}$/.test(s) ? s : ""
}

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const budgetId = String(id ?? "").trim()
  if (!budgetId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    const body = await req.json().catch(() => ({}))

    const month = body?.month !== undefined ? toMonth(body.month) : undefined
    const categoryId = body?.categoryId !== undefined ? String(body.categoryId).trim() : undefined
    const limitAmount = body?.limitAmount !== undefined ? Number(body.limitAmount) : undefined

    if (month !== undefined && !month) return NextResponse.json({ error: "month inválido (YYYY-MM)" }, { status: 400 })
    if (limitAmount !== undefined && (!Number.isFinite(limitAmount) || limitAmount <= 0)) {
      return NextResponse.json({ error: "limitAmount inválido" }, { status: 400 })
    }

    const rows = await sql`
      update budgets
      set
        month = coalesce(${month ?? null}::text, month),
        category_id = coalesce(${categoryId ?? null}::text, category_id),
        limit_amount = coalesce(${limitAmount ?? null}::numeric, limit_amount)
      where id = ${budgetId}
      returning id, month, category_id, limit_amount
    `

    if (!rows.length) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })

    const b: any = rows[0]
    return NextResponse.json({
      id: b.id,
      month: b.month,
      categoryId: b.category_id,
      limitAmount: Number(b.limit_amount ?? 0),
    })
  } catch (e: any) {
    console.error("PUT /api/budgets/[id] ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al actualizar presupuesto" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const budgetId = String(id ?? "").trim()
  if (!budgetId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    const chk = await sql`select count(*) as c from budgets where id = ${budgetId}`
    const exists = Number((chk as any[])[0]?.c ?? 0)
    if (!exists) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 })

    await sql`delete from budgets where id = ${budgetId}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("DELETE /api/budgets/[id] ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al eliminar presupuesto" }, { status: 500 })
  }
}
