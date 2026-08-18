import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText } from "@/lib/api-helpers";
import { pool } from "@/lib/db";
import { DEAL_STAGES } from "@/lib/types";

export async function GET() {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const { rows } = await pool.query(
    `SELECT d.id, d.title, d.value, d.stage, d.company_id, d.contact_id,
            d.expected_close, d.notes, d.created_at,
            co.name AS company_name,
            CONCAT(c.first_name, ' ', c.last_name) AS contact_name
     FROM deals d
     LEFT JOIN companies co ON co.id = d.company_id
     LEFT JOIN contacts c ON c.id = d.contact_id
     ORDER BY
       CASE d.stage WHEN 'won' THEN 1 WHEN 'lost' THEN 1 ELSE 0 END,
       d.created_at DESC`
  );
  return NextResponse.json({ deals: rows });
}

export async function POST(req: Request) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const body = await req.json().catch(() => ({}));
  const title = cleanText(body.title);
  if (!title) return jsonError("Deal title is required", 400);

  const value = Number(body.value);
  const stage = DEAL_STAGES.includes(body.stage) ? body.stage : "lead";
  const expected_close = typeof body.expected_close === "string" && body.expected_close ? body.expected_close : null;

  const { rows } = await pool.query(
    `INSERT INTO deals (title, value, stage, company_id, contact_id, expected_close, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING id, title, value, stage, company_id, contact_id, expected_close, notes, created_at`,
    [
      title,
      Number.isFinite(value) ? value : 0,
      stage,
      Number.isInteger(body.company_id) ? body.company_id : null,
      Number.isInteger(body.contact_id) ? body.contact_id : null,
      expected_close,
      cleanText(body.notes),
    ]
  );
  return NextResponse.json({ deal: rows[0] }, { status: 201 });
}
