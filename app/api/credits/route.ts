import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  const rows = await sql`
    select
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
    from credits
    order by created_at desc
  `

  const mapped = (rows as any[]).map((c) => ({
    id: c.id,
    name: c.name,
    totalAmount: Number(c.total_amount ?? 0),
    remainingAmount: Number(c.remaining_amount ?? 0),
    interestRate: Number(c.interest_rate ?? 0),
    monthlyPayment: Number(c.monthly_payment ?? 0),
    startDate: c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : "",
    endDate: c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : "",
    nextPaymentDate: c.next_payment_date ? new Date(c.next_payment_date).toISOString().slice(0, 10) : "",
    frequency: c.frequency,
    status: c.status,
    notes: c.notes ?? "",
    createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = String(body?.name ?? "").trim()
    const totalAmount = Number(body?.totalAmount ?? 0)
    const interestRate = Number(body?.interestRate ?? 0)
    const monthlyPayment = Number(body?.monthlyPayment ?? 0)

    const startDate = String(body?.startDate ?? "")
    const endDate = String(body?.endDate ?? "")
    const nextPaymentDate = String(body?.nextPaymentDate ?? "")
    const frequency = String(body?.frequency ?? "monthly")
    const status = String(body?.status ?? "active")
    const notes = String(body?.notes ?? "")

    if (!name) return NextResponse.json({ error: "name requerido" }, { status: 400 })
    if (!Number.isFinite(totalAmount)) return NextResponse.json({ error: "totalAmount inválido" }, { status: 400 })
    if (!Number.isFinite(interestRate)) return NextResponse.json({ error: "interestRate inválido" }, { status: 400 })
    if (!Number.isFinite(monthlyPayment)) return NextResponse.json({ error: "monthlyPayment inválido" }, { status: 400 })

    // Por tu esquema: remaining_amount y next_payment_date son NOT NULL
    // -> los definimos aquí si no vienen en el body
    const remainingAmount = Number.isFinite(Number(body?.remainingAmount))
      ? Number(body.remainingAmount)
      : totalAmount

    const computedNextPaymentDate =
      nextPaymentDate || startDate || null

    const rows = await sql`
      insert into credits (
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
        notes
      )
      values (
        gen_random_uuid()::text,
        ${name},
        ${totalAmount},
        ${remainingAmount},
        ${interestRate},
        ${monthlyPayment},
        ${startDate},
        ${endDate},
        ${computedNextPaymentDate},
        ${frequency},
        ${status},
        ${notes}
      )
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

    const c: any = rows[0]
    
await sql`
  insert into credit_payments (
    id,
    credit_id,
    amount,
    date,
    status,
    notes
  )
  values (
    gen_random_uuid()::text,
    ${c.id},
    ${Number(c.monthly_payment)},
    ${c.next_payment_date},
    'pending',
    'Primer pago programado'
  )
`
    return NextResponse.json(
      {
        id: c.id,
        name: c.name,
        totalAmount: Number(c.total_amount ?? 0),
        remainingAmount: Number(c.remaining_amount ?? 0),
        interestRate: Number(c.interest_rate ?? 0),
        monthlyPayment: Number(c.monthly_payment ?? 0),
        startDate: c.start_date ? new Date(c.start_date).toISOString().slice(0, 10) : "",
        endDate: c.end_date ? new Date(c.end_date).toISOString().slice(0, 10) : "",
        nextPaymentDate: c.next_payment_date ? new Date(c.next_payment_date).toISOString().slice(0, 10) : "",
        frequency: c.frequency,
        status: c.status,
        notes: c.notes ?? "",
        createdAt: c.created_at ? new Date(c.created_at).toISOString() : new Date().toISOString(),
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error("POST /api/credits ERROR:", e)
    return NextResponse.json({ error: e?.message ?? "Error al crear crédito" }, { status: 500 })
  }
}
