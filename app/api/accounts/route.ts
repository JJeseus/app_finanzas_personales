import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  const rows = await sql`
    select id, name, type, balance, notes
    from accounts
    order by name asc
  `

  const mapped = rows.map((a: any) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    initialBalance: Number(a.balance),
    notes: a.notes ?? "",
  }))

  return NextResponse.json(mapped)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const name = String(body?.name ?? "").trim()
    const type = String(body?.type ?? "").trim()
    const rawBalance = body?.initialBalance
    const notes = String(body?.notes ?? "")

    const initialBalance =
      rawBalance === "" || rawBalance === null || rawBalance === undefined
        ? 0
        : Number(rawBalance)

    if (!name) {
      return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: "El tipo es requerido" }, { status: 400 })
    }

    if (!Number.isFinite(initialBalance)) {
      return NextResponse.json({ error: "Saldo inicial inválido" }, { status: 400 })
    }

    const rows = await sql`
      insert into accounts (name, type, balance, notes)
      values (${name}, ${type}, ${initialBalance}, ${notes})
      returning id, name, type, balance, notes
    `

    const a: any = rows[0]

    return NextResponse.json(
      {
        id: a.id,
        name: a.name,
        type: a.type,
        initialBalance: Number(a.balance),
        notes: a.notes ?? "",
      },
      { status: 201 }
    )
  } catch (e: any) {
    console.error("POST /api/accounts ERROR:", e)
    return NextResponse.json(
      { error: e?.message ?? "Error al crear cuenta" },
      { status: 500 }
    )
  }
}