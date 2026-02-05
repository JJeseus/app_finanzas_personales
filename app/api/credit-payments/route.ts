import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

function toISODate(d: any) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const creditId = String(searchParams.get("creditId") ?? "").trim()

  const rows = creditId
    ? await sql`
        select
          p.id,
          p.credit_id,
          p.amount,
          p.date,
          p.status,
          p.notes,
          p.created_at
        from credit_payments p
        where p.credit_id = ${creditId}
        order by p.date desc, p.created_at desc
      `
    : await sql`
        select
          p.id,
          p.credit_id,
          p.amount,
          p.date,
          p.status,
          p.notes,
          p.created_at
        from credit_payments p
        order by p.date desc, p.created_at desc
      `

  const mapped = (rows as any[]).map((p) => ({
    id: p.id,
    creditId: p.credit_id,
    amount: Number(p.amount ?? 0),
    date: toISODate(p.date),
    status:
    p.status === "pending" && p.date && new Date(p.date) < new Date(new Date().toISOString().slice(0, 10))
    ? "overdue"
    : p.status,
    notes: p.notes ?? "",
    createdAt: p.created_at ? new Date(p.created_at).toISOString() : new Date().toISOString(),
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const creditId = String(body?.creditId ?? "").trim()
    const amount = Number(body?.amount ?? 0)
    const date = String(body?.date ?? "").trim() // YYYY-MM-DD
    const status = String(body?.status ?? "pending").trim() // 'paid' | 'pending' | 'overdue'
    const notes = String(body?.notes ?? "")

    if (!creditId) return NextResponse.json({ error: "creditId requerido" }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0)
      return NextResponse.json({ error: "amount inválido" }, { status: 400 })
    if (!date) return NextResponse.json({ error: "date requerida (YYYY-MM-DD)" }, { status: 400 })

    // Inserta el pago y (si status='paid') actualiza el crédito:
    // - remaining_amount -= amount (sin bajar de 0)
    // - next_payment_date avanza según frequency
    // - status del crédito pasa a 'paid' cuando remaining_amount llega a 0
    const rows = await sql`
      with inserted as (
        insert into credit_payments (id, credit_id, amount, date, status, notes)
        values (gen_random_uuid()::text, ${creditId}, ${amount}, ${date}, ${status}, ${notes})
        returning id, credit_id, amount, date, status, notes, created_at
      ),
      updated as (
        update credits c
        set
          remaining_amount =
            case
              when (select status from inserted) = 'paid'
                then greatest(c.remaining_amount - (select amount from inserted), 0)
              else c.remaining_amount
            end,
          next_payment_date =
            case
              when (select status from inserted) = 'paid' then
                (
                  case c.frequency
                    when 'weekly'   then (c.next_payment_date + interval '7 days')
                    when 'biweekly' then (c.next_payment_date + interval '14 days')
                    when 'monthly'  then (c.next_payment_date + interval '1 month')
                    when 'yearly'   then (c.next_payment_date + interval '1 year')
                    else (c.next_payment_date + interval '1 month')
                  end
                )::date
              else c.next_payment_date
            end,
          status =
            case
              when (select status from inserted) = 'paid'
               and greatest(c.remaining_amount - (select amount from inserted), 0) = 0
                then 'paid'
              else c.status
            end
        where c.id = ${creditId}
        returning c.id as credit_id_updated, c.remaining_amount, c.next_payment_date, c.status
      )
      select
        i.id,
        i.credit_id,
        i.amount,
        i.date,
        i.status,
        i.notes,
        i.created_at,
        u.remaining_amount,
        u.next_payment_date,
        u.status as credit_status
      from inserted i
      left join updated u on true
    `

    const r: any = rows[0]

    return NextResponse.json(
      {
        id: r.id,
        creditId: r.credit_id,
        amount: Number(r.amount ?? 0),
        date: toISODate(r.date),
        status: r.status,
        notes: r.notes ?? "",
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        // extra útil para refrescar la UI del crédito sin otra llamada
        credit: r.remaining_amount != null ? {
          remainingAmount: Number(r.remaining_amount ?? 0),
          nextPaymentDate: toISODate(r.next_payment_date),
          status: r.credit_status,
        } : null,
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error("POST /api/credit-payments ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al crear pago" }, { status: 500 })
  }
}
