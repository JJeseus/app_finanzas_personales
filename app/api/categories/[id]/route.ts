import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

type Ctx = { params: Promise<{ id: string }> }

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const body = await req.json()

    const name = body?.name !== undefined ? String(body.name).trim() : undefined
    const type = body?.type !== undefined ? String(body.type).trim() : undefined
    const icon = body?.icon !== undefined ? String(body.icon).trim() : undefined
    const color = body?.color !== undefined ? String(body.color).trim() : undefined

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
    if (type !== undefined && !["income", "expense", "both"].includes(type)) {
      return NextResponse.json({ error: "type must be income|expense|both" }, { status: 400 })
    }

    const rows = await sql`
      update categories
      set
        name  = coalesce(${name}, name),
        type  = coalesce(${type}, type),
        icon  = coalesce(${icon}, icon),
        color = coalesce(${color}, color)
      where id = ${id}
      returning id, name, type, icon, color
    `

    if (!rows.length) return NextResponse.json({ error: "Category not found" }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err: any) {
    console.error("PUT /api/categories/[id] failed:", err)
    return NextResponse.json({ error: err?.message ?? "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(_: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

    await sql`delete from categories where id = ${id}`
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("DELETE /api/categories/[id] failed:", err)
    return NextResponse.json({ error: err?.message ?? "Internal Server Error" }, { status: 500 })
  }
}
