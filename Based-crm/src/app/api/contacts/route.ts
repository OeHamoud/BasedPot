import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText } from "@/lib/api-helpers";
import { pool } from "@/lib/db";
import { CONTACT_STATUSES } from "@/lib/types";

export async function GET() {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const { rows } = await pool.query(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.job_title, c.status,
            c.company_id, c.notes, c.created_at, co.name AS company_name
     FROM contacts c
     LEFT JOIN companies co ON co.id = c.company_id
     ORDER BY c.created_at DESC`
  );
  return NextResponse.json({ contacts: rows });
}

export async function POST(req: Request) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const body = await req.json().catch(() => ({}));
  const first_name = cleanText(body.first_name);
  const last_name = cleanText(body.last_name);
  if (!first_name || !last_name) return jsonError("First and last name are required", 400);

  const email = cleanText(body.email);
  const phone = cleanText(body.phone);
  const job_title = cleanText(body.job_title);
  const notes = cleanText(body.notes);
  const status = CONTACT_STATUSES.includes(body.status) ? body.status : "lead";
  const company_id = Number.isInteger(body.company_id) ? body.company_id : null;

  const { rows } = await pool.query(
    `INSERT INTO contacts (first_name, last_name, email, phone, job_title, status, company_id, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, first_name, last_name, email, phone, job_title, status, company_id, notes, created_at`,
    [first_name, last_name, email, phone, job_title, status, company_id, notes]
  );
  return NextResponse.json({ contact: rows[0] }, { status: 201 });
}
