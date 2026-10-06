import { NextRequest, NextResponse } from "next/server";
import { createSession, destroySession } from "@/lib/auth";
import { demoLoginSchema } from "@/lib/api-validation";
import type { UserRole } from "@/types";

/**
 * Server-side allowlist of demo users; session is created only for these IDs.
 * Prevents clients from forging arbitrary userId/role/name.
 * Fictional identities are available only after explicit server-side opt-in.
 * The public flag controls the UI; it is not sufficient authorization on its own.
 */
const DEMO_USERS: Record<string, { role: UserRole; name: string }> = {
  "school-1": { role: "school", name: "Mersey View Primary (demo)" },
  "school-2": { role: "school", name: "Calder Street Community School (demo)" },
  "school-3": { role: "school", name: "Wavertree Learning Academy (demo)" },
  "teacher-1": { role: "teacher", name: "Sarah Johnson" },
  "teacher-2": { role: "teacher", name: "Michael Chen" },
  "teacher-3": { role: "teacher", name: "Amira Patel" },
  "teacher-4": { role: "teacher", name: "James O'Brien" },
  "agent-1": { role: "agent", name: "Sarah Mitchell" },
  "agent-2": { role: "agent", name: "James Powell" },
};

export async function POST(request: NextRequest) {
  if (process.env.DEMO_MODE !== "true" || process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo sign-in is disabled" }, { status: 403 });
  }
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
