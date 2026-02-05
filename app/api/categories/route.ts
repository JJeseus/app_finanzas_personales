import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  const rows = await sql`
    select id, name, type, icon, color
    from categories
    order by name asc
  `
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const body = await req.json()
  const name = String(body?.name ?? "").trim()
  const type = String(body?.type ?? "").trim()
  const icon = body?.icon == null ? null : String(body.icon)
  const color = body?.color == null ? null : String(body.color)

  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
  if (!type) return NextResponse.json({ error: "type is required" }, { status: 400 })

  const rows = await sql`
    insert into categories (name, type, icon, color)
    values (${name}, ${type}, ${icon}, ${color})
    returning id, name, type, icon, color
  `
  return NextResponse.json(rows[0], { status: 201 })
}
