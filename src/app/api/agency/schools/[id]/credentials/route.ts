import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencySetSchoolCredentialsSchema } from "@/lib/api-validation";
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
  const existing = db.select({ id: schools.id }).from(schools).where(eq(schools.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  const parsed = await validateBody(request, agencySetSchoolCredentialsSchema);
  if (!parsed.success) return parsed.response;

  const { contactEmail, temporaryPassword } = parsed.data;

  // Check email not taken by a different school
  const emailConflict = db.select({ id: schools.id }).from(schools).where(eq(schools.contactEmail, contactEmail)).get();
  if (emailConflict && emailConflict.id !== id) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { contactEmail: ["This email is already in use by another school"] } },
      { status: 400 }
    );
  }

  const passwordHash = bcrypt.hashSync(temporaryPassword, BCRYPT_ROUNDS);
  db.update(schools).set({ contactEmail, passwordHash }).where(eq(schools.id, id)).run();

  return NextResponse.json({ ok: true });
}
