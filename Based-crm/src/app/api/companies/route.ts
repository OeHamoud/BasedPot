import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText } from "@/lib/api-helpers";
import { pool } from "@/lib/db";

export async function GET() {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const { rows } = await pool.query(
    `SELECT co.id, co.name, co.industry, co.website, co.phone, co.city, co.country,
            co.notes, co.created_at, COUNT(c.id)::int AS contact_count
     FROM companies co
     LEFT JOIN contacts c ON c.company_id = co.id
     GROUP BY co.id
     ORDER BY co.created_at DESC`
  );
  return NextResponse.json({ companies: rows });
}

export async function POST(req: Request) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const body = await req.json().catch(() => ({}));
  const name = cleanText(body.name);
  if (!name) return jsonError("Company name is required", 400);

  const { rows } = await pool.query(
    `INSERT INTO companies (name, industry, website, phone, city, country, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, name, industry, website, phone, city, country, notes, created_at`,
    [
      name,
      cleanText(body.industry),
      cleanText(body.website),
      cleanText(body.phone),
      cleanText(body.city),
      cleanText(body.country),
      cleanText(body.notes),
    ]
  );
  return NextResponse.json({ company: rows[0] }, { status: 201 });
}
