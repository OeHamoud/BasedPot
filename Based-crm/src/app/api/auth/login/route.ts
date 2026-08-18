import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { jsonError, cleanText } from "@/lib/api-helpers";
import type { User } from "@/lib/types";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const email = cleanText((body as Record<string, unknown>)?.email)?.toLowerCase();
  const password = (body as Record<string, unknown>)?.password;

  if (!email || typeof password !== "string" || !password) {
    return jsonError("Email and password are required", 400);
  }

  const { rows } = await pool.query<User & { password_hash: string }>(
    "SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1",
    [email]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return jsonError("Invalid email or password", 401);
  }

  await createSession(user.id);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, created_at: user.created_at },
  });
}
