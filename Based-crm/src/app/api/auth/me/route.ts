import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { jsonError } from "@/lib/api-helpers";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Not authenticated", 401);
  return NextResponse.json({ user });
}
