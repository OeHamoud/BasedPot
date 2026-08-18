import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { pool } from "@/lib/db";
import type { User } from "@/lib/types";

export const SESSION_COOKIE = "basedcrm_session";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "based-crm-dev-secret-change-me-in-prod"
);

export async function createSession(userId: number) {
  const token = await new SignJWT({ sub: String(userId) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getUserId(): Promise<number | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const sub = payload.sub;
    if (!sub) return null;
    const id = Number(sub);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export const getSessionUser = cache(async (): Promise<User | null> => {
  const userId = await getUserId();
  if (!userId) return null;
  const { rows } = await pool.query<User>(
    "SELECT id, name, email, created_at FROM users WHERE id = $1",
    [userId]
  );
  return rows[0] ?? null;
});

export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
