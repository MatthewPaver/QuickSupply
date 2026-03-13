import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencySchoolStatusSchema } from "@/lib/api-validation";

export async function PATCH(
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

  const parsed = await validateBody(request, agencySchoolStatusSchema);
  if (!parsed.success) return parsed.response;

  db.update(schools).set({ isActive: parsed.data.isActive }).where(eq(schools.id, id)).run();
  return NextResponse.json({ ok: true });
}
