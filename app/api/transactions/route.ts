import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { dbMethodToUi, uiMethodToDb } from "@/lib/db-mappers";

export async function GET() {
  const rows = await sql`
    select
      id,
      type,
      amount,
      date,
      currency,
      category_id,
      account_id,
      description,
      method,
      status,
      tags,
      created_at
    from transactions
    order by date desc, created_at desc
  `;

  const mapped = rows.map((r: any) => ({
    id: r.id,
    date: new Date(r.date).toISOString().slice(0, 10), // YYYY-MM-DD
    type: r.type,
    amount: Number(r.amount),
    currency: r.currency ?? "MXN",
    categoryId: r.category_id,
    accountId: r.account_id,
    method: dbMethodToUi(r.method),
    description: r.description ?? "",
    tags: Array.isArray(r.tags) ? r.tags : [],
    status: r.status,
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  }));

  return NextResponse.json(mapped);
}

export async function POST(req: Request) {
  const body = await req.json();

  // Validación mínima
  const required = ["date", "type", "amount", "categoryId", "accountId", "method", "status"];
  for (const k of required) {
    if (body?.[k] === undefined || body?.[k] === null || body?.[k] === "") {
      return NextResponse.json({ error: `Missing field: ${k}` }, { status: 400 });
    }
  }

  const id = `tx-${Date.now()}`;
  const tags = Array.isArray(body.tags) ? body.tags : [];
  const currency = body.currency ?? "MXN";

  const [row] = await sql`
    insert into transactions (
      id, type, amount, date, currency,
      category_id, account_id, description,
      method, status, tags
    )
    values (
      ${id},
      ${body.type},
      ${body.amount},
      ${body.date},
      ${currency},
      ${body.categoryId},
      ${body.accountId},
      ${body.description ?? ""},
      ${uiMethodToDb(body.method)},
      ${body.status},
      ${tags}
    )
    returning *
  `;

  // Devolvemos ya en formato UI
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
