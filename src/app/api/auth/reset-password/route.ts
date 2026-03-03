import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { and, eq, gt, lte } from "drizzle-orm";
import * as bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { schools, teachers, agents, passwordResetTokens } from "@/lib/db/schema";
import {
  getClientIdentifier,
  rateLimitPasswordResetConfirm,
} from "@/lib/rate-limit";

const BCRYPT_ROUNDS = 10;

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (await rateLimitPasswordResetConfirm(identifier)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!token) {
    return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  db.delete(passwordResetTokens)
    .where(lte(passwordResetTokens.expiresAt, new Date()))
    .run();

  const tokenHash = hashResetToken(token);
  const now = new Date();
  const row = db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
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

  // Invalidate all outstanding reset links for this account.
  db.delete(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, row.userId),
        eq(passwordResetTokens.role, row.role)
      )
    )
    .run();

  return NextResponse.json({ message: "Password updated. You can now sign in." });
}
