import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

type Ctx = { params: Promise<{ id: string }> }

function toISODate(d: any) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

const allowedFreq = new Set(["weekly", "biweekly", "monthly", "yearly"])
const allowedStatus = new Set(["active", "paid", "overdue"])

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const creditId = String(id ?? "").trim()
  if (!creditId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    const body = await req.json().catch(() => ({}))

    // Campos opcionales
    const name = body?.name !== undefined ? String(body.name).trim() : undefined
    const notes = body?.notes !== undefined ? String(body.notes) : undefined

    const totalAmount =
      body?.totalAmount !== undefined ? Number(body.totalAmount) : undefined
    const remainingAmount =
      body?.remainingAmount !== undefined ? Number(body.remainingAmount) : undefined
    const interestRate =
      body?.interestRate !== undefined ? Number(body.interestRate) : undefined
    const monthlyPayment =
      body?.monthlyPayment !== undefined ? Number(body.monthlyPayment) : undefined

    const startDate = body?.startDate !== undefined ? String(body.startDate).trim() : undefined
    const endDate = body?.endDate !== undefined ? String(body.endDate).trim() : undefined
    const nextPaymentDate =
      body?.nextPaymentDate !== undefined ? String(body.nextPaymentDate).trim() : undefined

    const frequency = body?.frequency !== undefined ? String(body.frequency).trim() : undefined
    const status = body?.status !== undefined ? String(body.status).trim() : undefined

    // Validaciones
    if (frequency !== undefined && !allowedFreq.has(frequency)) {
      return NextResponse.json({ error: "frequency inválida" }, { status: 400 })
    }
    if (status !== undefined && !allowedStatus.has(status)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 })
    }

    const numsToCheck: Array<[string, number | undefined]> = [
      ["totalAmount", totalAmount],
      ["remainingAmount", remainingAmount],
      ["interestRate", interestRate],
      ["monthlyPayment", monthlyPayment],
    ]
    for (const [k, v] of numsToCheck) {
      if (v === undefined) continue
      if (!Number.isFinite(v)) return NextResponse.json({ error: `${k} inválido` }, { status: 400 })
      if (k !== "interestRate" && v < 0) return NextResponse.json({ error: `${k} no puede ser negativo` }, { status: 400 })
      if (k === "interestRate" && v < 0) return NextResponse.json({ error: "interestRate no puede ser negativo" }, { status: 400 })
    }

    // Regla de integridad: si el crédito ya está pagado, bloqueamos cambios “financieros”
    // (puedes relajarlo si quieres, pero esto te evita inconsistencias)
    const guardRows = await sql`select status from credits where id = ${creditId}`
    if (!guardRows.length) return NextResponse.json({ error: "Crédito no encontrado" }, { status: 404 })
    const currentStatus = String((guardRows as any[])[0].status ?? "")

    const touchingFinancial =
      totalAmount !== undefined ||
      remainingAmount !== undefined ||
      interestRate !== undefined ||
      monthlyPayment !== undefined ||
      startDate !== undefined ||
      endDate !== undefined ||
      nextPaymentDate !== undefined ||
      frequency !== undefined

    if (currentStatus === "paid" && touchingFinancial) {
      return NextResponse.json(
        { error: "No se permite editar montos/fechas de un crédito ya pagado." },
        { status: 400 }
      )
    }

    // Si se manda remainingAmount, lo limitamos a [0, totalAmount] si totalAmount está disponible (nuevo o actual)
    // Tomamos total actual si no mandan totalAmount
    let totalForClamp: number | null = null
    if (totalAmount !== undefined) {
      totalForClamp = totalAmount
    } else {
      const t = await sql`select total_amount from credits where id = ${creditId}`
      totalForClamp = t.length ? Number((t as any[])[0].total_amount ?? 0) : null
    }

    const clampedRemaining =
      remainingAmount === undefined
        ? undefined
        : Math.max(0, totalForClamp == null ? remainingAmount : Math.min(remainingAmount, totalForClamp))

    const rows = await sql`
      update credits
      set
        name            = coalesce(${name ?? null}::text, name),
        total_amount    = coalesce(${totalAmount ?? null}::numeric, total_amount),
        remaining_amount= coalesce(${clampedRemaining ?? null}::numeric, remaining_amount),
        interest_rate   = coalesce(${interestRate ?? null}::numeric, interest_rate),
        monthly_payment = coalesce(${monthlyPayment ?? null}::numeric, monthly_payment),
        start_date      = coalesce(${startDate ?? null}::date, start_date),
        end_date        = coalesce(${endDate ?? null}::date, end_date),
        next_payment_date = coalesce(${nextPaymentDate ?? null}::date, next_payment_date),
        frequency       = coalesce(${frequency ?? null}::text, frequency),
        status          = coalesce(${status ?? null}::text, status),
        notes           = coalesce(${notes ?? null}::text, notes)
      where id = ${creditId}
      returning
        id,
        name,
        total_amount,
        remaining_amount,
        interest_rate,
        monthly_payment,
        start_date,
        end_date,
        next_payment_date,
        frequency,
        status,
        notes,
        created_at
    `

    const c: any = (rows as any[])[0]
    return NextResponse.json({
      id: c.id,
      name: c.name,
      totalAmount: Number(c.total_amount ?? 0),
      remainingAmount: Number(c.remaining_amount ?? 0),
      interestRate: Number(c.interest_rate ?? 0),
      monthlyPayment: Number(c.monthly_payment ?? 0),
      startDate: toISODate(c.start_date),
      endDate: toISODate(c.end_date),
      nextPaymentDate: toISODate(c.next_payment_date),
      frequency: c.frequency,
      status: c.status,
      notes: c.notes ?? "",
      createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
    })
  } catch (e: any) {
    console.error("PUT /api/credits/[id] ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al actualizar crédito" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const creditId = String(id ?? "").trim()
  if (!creditId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    // Bloquea borrar si hay pagos PAID (histórico)
    const chk = await sql`
      select
        (select count(*) from credits where id = ${creditId}) as exists_credit,
        (select count(*) from credit_payments where credit_id = ${creditId} and status = 'paid') as paid_payments
    `
    const r: any = (chk as any[])[0]
    if (!r || Number(r.exists_credit) === 0) return NextResponse.json({ error: "Crédito no encontrado" }, { status: 404 })
    if (Number(r.paid_payments) > 0) {
      return NextResponse.json(
        { error: "No se permite borrar un crédito con pagos 'paid' (mantén trazabilidad)." },
        { status: 400 }
      )
    }

    // Por FK ON DELETE CASCADE en credit_payments, se borran pagos pendientes/vencidos automáticamente
    await sql`delete from credits where id = ${creditId}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("DELETE /api/credits/[id] ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al eliminar crédito" }, { status: 500 })
  }
}
