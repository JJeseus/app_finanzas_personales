import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    select id, name, type, balance, notes
    from accounts
    order by name asc
  `;

  // Mapeo BD -> UI
  const mapped = rows.map((a: any) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    initialBalance: Number(a.balance),   // UI espera initialBalance
    notes: a.notes ?? "",
  }));

  return NextResponse.json(mapped);
}
