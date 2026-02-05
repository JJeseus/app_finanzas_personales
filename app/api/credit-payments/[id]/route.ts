// app/api/credit-payments/[id]/route.ts
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function toISODate(d: any) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const paymentId = String(id ?? "").trim()
  if (!paymentId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    const body = await req.json().catch(() => ({}))

    const statusRaw = body?.status != null ? String(body.status).trim() : undefined
    const notesRaw = body?.notes != null ? String(body.notes) : undefined
    const dateRaw = body?.date != null ? String(body.date).trim() : undefined

    const allowedStatus = new Set(["paid", "pending", "overdue"])
    if (statusRaw !== undefined && !allowedStatus.has(statusRaw)) {
      return NextResponse.json({ error: "status inválido" }, { status: 400 })
    }

    const rows = await sql`
      with current as (
        select id, credit_id, amount, date, status, notes, created_at
        from credit_payments
        where id = ${paymentId}
      ),
      guard as (
        select
          (select status from current) as old_status,
          ${statusRaw ?? null}::text as new_status
      ),
      blocked as (
        select
          case
            when (select old_status from guard) = 'paid'
             and (select new_status from guard) is not null
             and (select new_status from guard) <> 'paid'
              then true
            else false
          end as is_blocked
      ),
      updated_payment as (
        update credit_payments p
        set
          status = coalesce(${statusRaw ?? null}::text, p.status),
          notes  = coalesce(${notesRaw ?? null}::text, p.notes),
          date   = coalesce(${dateRaw ?? null}::date, p.date)
        where p.id = ${paymentId}
          and exists (select 1 from current)
          and (select is_blocked from blocked) = false
        returning p.id, p.credit_id, p.amount, p.date, p.status, p.notes, p.created_at
      ),
      updated_credit as (
        update credits c
        set
          remaining_amount = greatest(c.remaining_amount - (select amount from updated_payment), 0),
          next_payment_date =
            (
              case c.frequency
                when 'weekly'   then (c.next_payment_date + interval '7 days')
                when 'biweekly' then (c.next_payment_date + interval '14 days')
                when 'monthly'  then (c.next_payment_date + interval '1 month')
                when 'yearly'   then (c.next_payment_date + interval '1 year')
                else (c.next_payment_date + interval '1 month')
              end
            )::date,
          status =
            case
              when greatest(c.remaining_amount - (select amount from updated_payment), 0) = 0
                then 'paid'
              else c.status
            end
        where c.id = (select credit_id from updated_payment)
          and (select status from current) <> 'paid'
          and (select status from updated_payment) = 'paid'
        returning c.id as credit_id_updated, c.remaining_amount, c.next_payment_date, c.status as credit_status
      )
      select
        (select is_blocked from blocked) as is_blocked,
        (select count(*) from current) as exists_payment,
        up.id,
        up.credit_id,
        up.amount,
        up.date,
        up.status,
        up.notes,
        up.created_at,
        uc.remaining_amount,
        uc.next_payment_date,
        uc.credit_status
      from updated_payment up
      left join updated_credit uc on true
    `

    const r: any = rows?.[0]

    if (!r || Number(r.exists_payment) === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }
    if (r.is_blocked) {
      return NextResponse.json(
        { error: "No se permite cambiar un pago 'paid' a otro estado (reversión no soportada)." },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: r.id,
      creditId: r.credit_id,
      amount: Number(r.amount ?? 0),
      date: toISODate(r.date),
      status: r.status,
      notes: r.notes ?? "",
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
      credit: r.remaining_amount != null ? {
        remainingAmount: Number(r.remaining_amount ?? 0),
        nextPaymentDate: toISODate(r.next_payment_date),
        status: r.credit_status,
      } : null,
    })
  } catch (e: any) {
    console.error("PUT /api/credit-payments/[id] ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al actualizar pago" }, { status: 500 })
  }
}

type CtxDel = { params: Promise<{ id: string }> }

export async function DELETE(_req: Request, ctx: CtxDel) {
  const { id } = await ctx.params
  const paymentId = String(id ?? "").trim()
  if (!paymentId) return NextResponse.json({ error: "id requerido" }, { status: 400 })

  try {
    const rows = await sql`
      with cur as (
        select id, status from credit_payments where id = ${paymentId}
      )
      select
        (select count(*) from cur) as exists_payment,
        (select status from cur) as status
    `
    const cur: any = rows?.[0]
    if (!cur || Number(cur.exists_payment) === 0) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }
    if (cur.status === "paid") {
      return NextResponse.json(
        { error: "No se permite borrar un pago 'paid' (para no desajustar el crédito)." },
        { status: 400 }
      )
    }

    await sql`delete from credit_payments where id = ${paymentId}`
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("DELETE /api/credit-payments/[id] ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al eliminar pago" }, { status: 500 })
  }
}
