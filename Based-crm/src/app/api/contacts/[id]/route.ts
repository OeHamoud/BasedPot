import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText, parseId } from "@/lib/api-helpers";
import { pool } from "@/lib/db";
import { CONTACT_STATUSES } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid contact id", 400);
  const { rows } = await pool.query(
    `SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.job_title, c.status,
            c.company_id, c.notes, c.created_at, co.name AS company_name
     FROM contacts c LEFT JOIN companies co ON co.id = c.company_id WHERE c.id = $1`,
    [id]
  );
  if (!rows[0]) return jsonError("Contact not found", 404);
  return NextResponse.json({ contact: rows[0] });
}

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid contact id", 400);

  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: unknown[] = [];
  const push = (col: string, val: unknown) => {
    fields.push(`${col} = $${values.length + 1}`);
    values.push(val);
  };

  const first_name = cleanText(body.first_name);
  const last_name = cleanText(body.last_name);
  if (first_name) push("first_name", first_name);
  if (last_name) push("last_name", last_name);
  if (typeof body.email === "string") push("email", cleanText(body.email));
  if (typeof body.phone === "string") push("phone", cleanText(body.phone));
  if (typeof body.job_title === "string") push("job_title", cleanText(body.job_title));
  if (typeof body.notes === "string") push("notes", cleanText(body.notes));
  if (CONTACT_STATUSES.includes(body.status)) push("status", body.status);
  if (body.company_id === null || Number.isInteger(body.company_id))
    push("company_id", Number.isInteger(body.company_id) ? body.company_id : null);

  if (!fields.length) return jsonError("No fields to update", 400);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE contacts SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id`,
    values
  );
  if (!rows[0]) return jsonError("Contact not found", 404);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid contact id", 400);
  const { rowCount } = await pool.query("DELETE FROM contacts WHERE id = $1", [id]);
  if (!rowCount) return jsonError("Contact not found", 404);
  return NextResponse.json({ ok: true });
}
