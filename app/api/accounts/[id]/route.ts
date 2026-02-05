import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const name = body?.name !== undefined ? String(body.name).trim() : null
    const type = body?.type !== undefined ? String(body.type).trim() : null
    const notes = body?.notes !== undefined ? String(body.notes) : null

    const rawBalance = body?.initialBalance
    const balance =
      rawBalance === undefined || rawBalance === null || rawBalance === ""
        ? null
        : Number(rawBalance)

    if (balance !== null && !Number.isFinite(balance)) {
      return NextResponse.json({ error: "Saldo inválido" }, { status: 400 })
    }

    const rows = await sql`
      update accounts
      set
        name = coalesce(${name}, name),
        type = coalesce(${type}, type),
        balance = coalesce(${balance}, balance),
        notes = coalesce(${notes}, notes)
      where id = ${id}
      returning id, name, type, balance, color, notes
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })
    }

    const a: any = rows[0]
    return NextResponse.json({
      id: a.id,
      name: a.name,
      type: a.type,
      initialBalance: Number(a.balance),
      color: a.color,
      notes: a.notes ?? "",
    })
  } catch (e: any) {
    console.error("PUT /api/accounts/[id] ERROR:", e)
    return NextResponse.json(
      { error: e?.message ?? "Error al actualizar cuenta" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rows = await sql`
      delete from accounts
      where id = ${id}
      returning id
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error("DELETE /api/accounts/[id] ERROR:", e)
    return NextResponse.json(
      { error: e?.message ?? "Error al eliminar cuenta" },
      { status: 500 }
    )
  }
}
