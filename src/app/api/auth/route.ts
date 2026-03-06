import { NextRequest, NextResponse } from "next/server";
import { createSession, destroySession } from "@/lib/auth";
import { demoLoginSchema } from "@/lib/api-validation";
import type { UserRole } from "@/types";

/**
 * Server-side allowlist of demo users; session is created only for these IDs.
 * Prevents clients from forging arbitrary userId/role/name.
 * No rate limiting needed: this endpoint only accepts IDs from a fixed allowlist
 * (no credential brute-forcing possible). The real login (/api/auth/login) is rate-limited.
 */
const DEMO_USERS: Record<string, { role: UserRole; name: string }> = {
  "school-1": { role: "school", name: "St. Mary's Catholic Primary" },
  "school-2": { role: "school", name: "Kensington Primary" },
  "school-3": { role: "school", name: "Broadgreen International" },
  "teacher-1": { role: "teacher", name: "Sarah Johnson" },
  "teacher-2": { role: "teacher", name: "Michael Chen" },
  "teacher-3": { role: "teacher", name: "Amira Patel" },
  "teacher-4": { role: "teacher", name: "James O'Brien" },
  "agent-1": { role: "agent", name: "Sarah Mitchell" },
  "agent-2": { role: "agent", name: "James Powell" },
};

export async function POST(request: NextRequest) {
  const parsed = demoLoginSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  const { userId } = parsed.data;

  const demo = DEMO_USERS[userId];
  if (!demo) {
    return NextResponse.json({ error: "Unknown user" }, { status: 403 });
  }

  await createSession(userId, demo.role, demo.name);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
