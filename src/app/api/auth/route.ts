import { NextRequest, NextResponse } from "next/server";
import { createSession, destroySession } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, role, name } = body as {
    userId: string;
    role: UserRole;
    name: string;
  };

  if (!userId || !role || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await createSession(userId, role, name);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
