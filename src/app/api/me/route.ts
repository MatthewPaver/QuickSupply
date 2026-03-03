import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { schools, teachers, agents } from "@/lib/db/schema";

/** Returns current session for client-side SSE subscription (userId, role, name). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.userId,
    role: session.role,
    name: session.name,
  });
}

/** Request account deletion: anonymise PII for the current user and clear session. */
export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deletedPlaceholder = "deleted";
  // Hash that cannot be used to log in (no-one knows the plaintext)
  const disabledPasswordHash = bcrypt.hashSync("deleted-account-no-login", 10);

  if (session.role === "school") {
    await db
      .update(schools)
      .set({
        contactName: deletedPlaceholder,
        contactEmail: deletedPlaceholder,
        contactPhone: deletedPlaceholder,
        passwordHash: disabledPasswordHash,
      })
      .where(eq(schools.id, session.userId));
  } else if (session.role === "teacher") {
    await db
      .update(teachers)
      .set({
        firstName: deletedPlaceholder,
        lastName: deletedPlaceholder,
        email: deletedPlaceholder,
        phone: deletedPlaceholder,
        passwordHash: disabledPasswordHash,
      })
      .where(eq(teachers.id, session.userId));
  } else {
    await db
      .update(agents)
      .set({
        name: deletedPlaceholder,
        email: deletedPlaceholder,
        passwordHash: disabledPasswordHash,
      })
      .where(eq(agents.id, session.userId));
  }

  await destroySession();
  return NextResponse.json({ ok: true });
}
