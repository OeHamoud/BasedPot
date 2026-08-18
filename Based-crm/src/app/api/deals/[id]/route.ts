import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText, parseId } from "@/lib/api-helpers";
import { pool } from "@/lib/db";
import { DEAL_STAGES } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid deal id", 400);

  const body = await req.json().catch(() => ({}));
  const fields: string[] = [];
  const values: unknown[] = [];
  const push = (col: string, val: unknown) => {
    fields.push(`${col} = $${values.length + 1}`);
    values.push(val);
  };

  const title = cleanText(body.title);
  if (title) push("title", title);
  if (typeof body.value === "number" || typeof body.value === "string") {
    const value = Number(body.value);
    if (Number.isFinite(value)) push("value", value);
  }
  if (DEAL_STAGES.includes(body.stage)) push("stage", body.stage);
  if (body.expected_close === null || typeof body.expected_close === "string")
    push("expected_close", body.expected_close || null);
  if (typeof body.notes === "string") push("notes", cleanText(body.notes));
  if (body.company_id === null || Number.isInteger(body.company_id))
    push("company_id", Number.isInteger(body.company_id) ? body.company_id : null);
  if (body.contact_id === null || Number.isInteger(body.contact_id))
    push("contact_id", Number.isInteger(body.contact_id) ? body.contact_id : null);

  if (!fields.length) return jsonError("No fields to update", 400);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE deals SET ${fields.join(", ")} WHERE id = $${values.length} RETURNING id`,
    values
  );
  if (!rows[0]) return jsonError("Deal not found", 404);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  if (!(await getSessionUser())) return jsonError("Not authenticated", 401);
  const id = parseId((await params).id);
  if (!id) return jsonError("Invalid deal id", 400);
  const { rowCount } = await pool.query("DELETE FROM deals WHERE id = $1", [id]);
  if (!rowCount) return jsonError("Deal not found", 404);
  return NextResponse.json({ ok: true });
}
