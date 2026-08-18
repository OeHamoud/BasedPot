import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText, parseId } from "@/lib/api-helpers";
import { pool } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid company id", 400);

  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: unknown[] = [];
  const push = (col: string, val: unknown) => {
    fields.push(`${col} = $${values.length + 1}`);
    values.push(val);
  };

  const name = cleanText(body.name);
  if (name) push("name", name);
  if (typeof body.industry === "string") push("industry", cleanText(body.industry));
  if (typeof body.website === "string") push("website", cleanText(body.website));
  if (typeof body.phone === "string") push("phone", cleanText(body.phone));
  if (typeof body.city === "string") push("city", cleanText(body.city));
  if (typeof body.country === "string") push("country", cleanText(body.country));
  if (typeof body.notes === "string") push("notes", cleanText(body.notes));

  if (!fields.length) return jsonError("No fields to update", 400);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE companies SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id`,
    values
  );
  if (!rows[0]) return jsonError("Company not found", 404);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid company id", 400);
  const { rowCount } = await pool.query("DELETE FROM companies WHERE id = $1", [id]);
  if (!rowCount) return jsonError("Company not found", 404);
  return NextResponse.json({ ok: true });
}
