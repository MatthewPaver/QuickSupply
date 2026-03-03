import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { schools, teachers, agents, passwordResetTokens } from "@/lib/db/schema";

const BCRYPT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!token) {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const now = new Date();
  const row = db
    .select()
    .from(passwordResetTokens)
    .where(and(eq(passwordResetTokens.token, token), gt(passwordResetTokens.expiresAt, now)))
    .get();

  if (!row) {
    return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
  }

  const hashed = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);

  if (row.role === "school") {
    db.update(schools).set({ passwordHash: hashed }).where(eq(schools.id, row.userId)).run();
  } else if (row.role === "teacher") {
    db.update(teachers).set({ passwordHash: hashed }).where(eq(teachers.id, row.userId)).run();
  } else {
    db.update(agents).set({ passwordHash: hashed }).where(eq(agents.id, row.userId)).run();
  }

  db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, row.id)).run();

  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
