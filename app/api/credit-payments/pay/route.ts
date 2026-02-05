// app/api/credit-payments/pay/route.ts
import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { uiMethodToDb } from "@/lib/db-mappers"
import type { PaymentMethod } from "@/lib/types"

function toISODate(d: any) {
  return d ? new Date(d).toISOString().slice(0, 10) : ""
}

const allowedMethods = new Set<PaymentMethod>(["efectivo", "tarjeta", "transferencia", "otro"])
function parsePaymentMethod(v: unknown): PaymentMethod | null {
  const s = String(v ?? "").trim().toLowerCase() as PaymentMethod
  return allowedMethods.has(s) ? s : null
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))

    // ✅ Pago a convertir (ID del pago programado)
    const paymentId = String(body?.paymentId ?? "").trim()

    // Opcional: si tu UI manda creditId también, lo usamos como validación adicional (no obligatorio)
    const creditIdFromBody = String(body?.creditId ?? "").trim()

    const amount = Number(body?.amount ?? 0)
    const date = String(body?.date ?? "").trim() // YYYY-MM-DD
    const notes = String(body?.notes ?? "")

    // Para transaction
    const accountId = String(body?.accountId ?? "").trim()
    const categoryId = String(body?.categoryId ?? "").trim()
    const methodUi = parsePaymentMethod(body?.method)
    const currency = String(body?.currency ?? "MXN").trim()
    const description = String(body?.description ?? "").trim() // si viene vacío lo armamos después
    const tags = Array.isArray(body?.tags) ? body.tags : []

    if (!paymentId) return NextResponse.json({ error: "paymentId requerido" }, { status: 400 })
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "amount inválido" }, { status: 400 })
    if (!date) return NextResponse.json({ error: "date requerida (YYYY-MM-DD)" }, { status: 400 })

    if (!accountId) return NextResponse.json({ error: "accountId requerido" }, { status: 400 })
    if (!categoryId) return NextResponse.json({ error: "categoryId requerido" }, { status: 400 })
    if (!methodUi) return NextResponse.json({ error: "method inválido" }, { status: 400 })

    const rows = await sql`
      with current as (
        select id, credit_id, amount, date, status, notes, created_at
        from credit_payments
        where id = ${paymentId}
      ),
      guard as (
        select
          (select count(*) from current) as exists_payment,
          (select status from current) as old_status
      ),
      updated_payment as (
        update credit_payments p
        set
          status = 'paid',
          amount = ${amount},
          date   = ${date}::date,
          notes  = ${notes}
        where p.id = ${paymentId}
          and (select exists_payment from guard) = 1
          and (select old_status from guard) <> 'paid'
          -- validación extra opcional: si mandas creditId en body, lo obligamos a coincidir
          and (
            ${creditIdFromBody} = '' or p.credit_id = ${creditIdFromBody}
          )
        returning p.id, p.credit_id, p.amount, p.date, p.status, p.notes, p.created_at
      ),
inserted_tx as (
  insert into transactions (
    id, type, amount, date, currency,
    category_id, account_id, description,
    method, status, tags, notes
  )
        select
            gen_random_uuid()::text,
            'expense',
            up.amount,
            up.date,
            ${currency},
            ${categoryId},
            ${accountId},
            ('Pago de: ' || coalesce(c.name, up.credit_id)),
            ${uiMethodToDb(methodUi)},
            'confirmed',
            ${tags},
            up.notes
        from updated_payment up
        left join credits c on c.id = up.credit_id
        returning id, created_at
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
        returning c.id, c.remaining_amount, c.next_payment_date, c.status
      ), 
        next_pending as (
        insert into credit_payments (id, credit_id, amount, date, status, notes)
        select
            gen_random_uuid()::text,
            uc.id,
            -- 🔧 AJUSTA ESTA COLUMNA si tu DB no se llama monthly_payment
            greatest(c.monthly_payment, 0),
            uc.next_payment_date,
            'pending',
            ''
        from updated_credit uc
        join credits c on c.id = uc.id
        where uc.remaining_amount > 0
            and uc.status <> 'paid'
            and not exists (
            select 1
            from credit_payments p
            where p.credit_id = uc.id
                and p.status = 'pending'
                and p.date = uc.next_payment_date
            )
        returning id as next_payment_id, credit_id, amount, date, status
        )

      select
        (select exists_payment from guard) as exists_payment,
        (select old_status from guard) as old_status,
        up.id,
        up.credit_id,
        up.amount,
        up.date,
        up.status,
        up.notes,
        up.created_at,
        tx.id as tx_id,
        uc.remaining_amount,
        uc.next_payment_date,
        uc.status as credit_status
      from updated_payment up
      join inserted_tx tx on true
      join updated_credit uc on true
    `

    const r: any = rows?.[0]

    // No existía el paymentId
    if (!r || Number(r.exists_payment) === 0) {
      return NextResponse.json({ error: "Pago no encontrado preventing update" }, { status: 404 })
    }

    // Ya estaba pagado (doble click / doble intento)
    if (r.old_status === "paid" && !r.id) {
      return NextResponse.json({ error: "Este pago ya estaba marcado como 'paid'." }, { status: 400 })
    }

    // Si por alguna razón no se actualizó (ej. creditId mismatch)
    if (!r.id) {
      return NextResponse.json({ error: "No se pudo actualizar el pago (verifica creditId/paymentId)." }, { status: 400 })
    }

    return NextResponse.json(
      {
        payment: {
          id: r.id,
          creditId: r.credit_id,
          amount: Number(r.amount ?? 0),
          date: toISODate(r.date),
          status: r.status,
          notes: r.notes ?? "",
          createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
        },
        transactionId: r.tx_id,
        credit: {
          remainingAmount: Number(r.remaining_amount ?? 0),
          nextPaymentDate: toISODate(r.next_payment_date),
          status: r.credit_status,
        },
      },
      { status: 200 }
    )
  } catch (e: any) {
    console.error("POST /api/credit-payments/pay ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al registrar pago" }, { status: 500 })
  }
}
