import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { ulid } from "ulid";
import { db } from "@/lib/db";
import { schools, teachers, agents, passwordResetTokens } from "@/lib/db/schema";
import { sendNotificationEmail } from "@/lib/email";
import { getClientIdentifier, rateLimitPasswordReset } from "@/lib/rate-limit";
import { sql } from "drizzle-orm";

type UserRole = "school" | "teacher" | "agent";

/** Find user by email (case-insensitive); returns { userId, role, email } or null. */
function findUserByEmail(
  email: string
): { userId: string; role: UserRole; email: string } | null {
  const normalised = email.trim().toLowerCase();
  if (!normalised) return null;

  const agent = db.select().from(agents).where(sql`lower(${agents.email}) = ${normalised}`).get();
  if (agent) return { userId: agent.id, role: "agent", email: agent.email };

  const teacher = db.select().from(teachers).where(sql`lower(${teachers.email}) = ${normalised}`).get();
  if (teacher) return { userId: teacher.id, role: "teacher", email: teacher.email };

  const school = db.select().from(schools).where(sql`lower(${schools.contactEmail}) = ${normalised}`).get();
  if (school) return { userId: school.id, role: "school", email: school.contactEmail };

  return null;
}

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (rateLimitPasswordReset(identifier)) {
    // Return the same generic message so rate limiting isn't detectable
    return NextResponse.json(
      { message: "If that email is registered, you will receive a reset link." },
      { status: 200 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email : "";

  if (!email.trim()) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "If that email is registered, you will receive a reset link." }, { status: 200 });
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  const id = ulid();

  db.insert(passwordResetTokens)
    .values({
      id,
      userId: user.userId,
      role: user.role,
      token,
      expiresAt,
      createdAt: new Date(),
    })
    .run();

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  const subject = "Reset your QuickSupply password";
  const bodyText = `You requested a password reset. Click the link below to set a new password (valid for ${TOKEN_EXPIRY_HOURS} hour(s)):\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`;

  await sendNotificationEmail(user.email, subject, bodyText);

  return NextResponse.json({ message: "If that email is registered, you will receive a reset link." });
}
