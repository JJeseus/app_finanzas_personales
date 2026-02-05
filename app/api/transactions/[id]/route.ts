import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { dbMethodToUi, uiMethodToDb } from "@/lib/db-mappers";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  // Validación mínima
  const required = ["date", "type", "amount", "categoryId", "accountId", "method", "status"];
  for (const k of required) {
    if (body?.[k] === undefined || body?.[k] === null || body?.[k] === "") {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
    }
  }

  const tags = Array.isArray(body.tags) ? body.tags : [];
  const currency = body.currency ?? "MXN";

  const rows = await sql`
    update transactions
    set
      date = ${body.date},
      type = ${body.type},
      amount = ${body.amount},
      currency = ${currency},
      category_id = ${body.categoryId},
      account_id = ${body.accountId},
      description = ${body.description ?? ""},
      method = ${uiMethodToDb(body.method)},
      status = ${body.status},
      tags = ${tags}
    where id = ${id}
    returning *
  `;

  const row: any = rows[0];
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: row.id,
    date: new Date(row.date).toISOString().slice(0, 10),
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency ?? "MXN",
    categoryId: row.category_id,
    accountId: row.account_id,
    method: dbMethodToUi(row.method),
    description: row.description ?? "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    status: row.status,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const rows = await sql`
    delete from transactions
    where id = ${id}
    returning id
  `;

  if (!rows[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
