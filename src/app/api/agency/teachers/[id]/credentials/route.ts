import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencySetCredentialsSchema } from "@/lib/api-validation";
import * as bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = db.select({ id: teachers.id }).from(teachers).where(eq(teachers.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const parsed = await validateBody(request, agencySetCredentialsSchema);
  if (!parsed.success) return parsed.response;

  const { email, temporaryPassword } = parsed.data;

  // Check email not taken by a different teacher
  const emailConflict = db
    .select({ id: teachers.id })
    .from(teachers)
    .where(eq(teachers.email, email))
    .get();
  if (emailConflict && emailConflict.id !== id) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { email: ["This email is already in use by another teacher"] } },
      { status: 400 }
    );
  }

  const passwordHash = bcrypt.hashSync(temporaryPassword, BCRYPT_ROUNDS);
  db.update(teachers).set({ email, passwordHash }).where(eq(teachers.id, id)).run();

  return NextResponse.json({ ok: true });
}
