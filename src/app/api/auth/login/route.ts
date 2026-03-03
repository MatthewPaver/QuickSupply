import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { schools, teachers, agents } from "@/lib/db/schema";
import { createSession } from "@/lib/auth";
import { getClientIdentifier, rateLimitLogin } from "@/lib/rate-limit";
import type { UserRole } from "@/types";

/**
 * Resolves a user by email (case-insensitive): checks agents, then teachers, then schools.
 * Returns { userId, role, name, passwordHash } or null if not found.
 */
function findUserByEmail(email: string): { userId: string; role: UserRole; name: string; passwordHash: string } | null {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return null;

  const agent = db.select().from(agents).where(sql`lower(${agents.email}) = ${normalised}`).get();
  if (agent) {
    return {
      userId: agent.id,
      role: "agent",
      name: agent.name,
      passwordHash: agent.passwordHash,
    };
  }

  const teacher = db.select().from(teachers).where(sql`lower(${teachers.email}) = ${normalised}`).get();
  if (teacher) {
    return {
      userId: teacher.id,
      role: "teacher",
      name: `${teacher.firstName} ${teacher.lastName}`,
      passwordHash: teacher.passwordHash,
    };
  }

  const school = db.select().from(schools).where(sql`lower(${schools.contactEmail}) = ${normalised}`).get();
  if (school) {
    return {
      userId: school.id,
      role: "school",
      name: school.name,
      passwordHash: school.passwordHash,
    };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (rateLimitLogin(identifier)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = bcrypt.compareSync(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.userId, user.role, user.name);
  return NextResponse.json({ ok: true, role: user.role });
}
