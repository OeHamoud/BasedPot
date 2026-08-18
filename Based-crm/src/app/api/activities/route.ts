import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError, cleanText } from "@/lib/api-helpers";
import { pool } from "@/lib/db";
import { ACTIVITY_KINDS } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);
  const { rows } = await pool.query(
    `SELECT a.id, a.kind, a.subject, a.body, a.contact_id, a.deal_id, a.author_id, a.created_at,
            u.name AS author_name,
            CONCAT(c.first_name, ' ', c.last_name) AS contact_name,
            d.title AS deal_title
     FROM activities a
     LEFT JOIN users u ON u.id = a.author_id
     LEFT JOIN contacts c ON c.id = a.contact_id
     LEFT JOIN deals d ON d.id = a.deal_id
     ORDER BY a.created_at DESC
     LIMIT 30`
  );
  return NextResponse.json({ activities: rows });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);
  const body = await req.json().catch(() => ({}));
  const subject = cleanText(body.subject);
  if (!subject) return jsonError("Subject is required", 400);

  const kind = ACTIVITY_KINDS.includes(body.kind) ? body.kind : "note";
  const { rows } = await pool.query(
    `INSERT INTO activities (kind, subject, body, contact_id, deal_id, author_id)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, kind, subject, body, contact_id, deal_id, author_id, created_at`,
    [
      kind,
      subject,
      cleanText(body.body),
      Number.isInteger(body.contact_id) ? body.contact_id : null,
      Number.isInteger(body.deal_id) ? body.deal_id : null,
      user.id,
    ]
  );
  return NextResponse.json({ activity: rows[0] }, { status: 201 });
}
