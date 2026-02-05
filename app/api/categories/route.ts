import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  const rows = await sql`
    select id, name, type, icon, color
    from categories
    order by name asc
  `;
  return NextResponse.json(rows);
}
