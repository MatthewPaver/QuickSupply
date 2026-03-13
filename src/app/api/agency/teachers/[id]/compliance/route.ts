import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencyUpdateComplianceSchema } from "@/lib/api-validation";

export async function PATCH(
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

  const parsed = await validateBody(request, agencyUpdateComplianceSchema);
  if (!parsed.success) return parsed.response;

  const { dbsStatus, dbsExpiry, rightToWork, complianceStatus, complianceNotes } = parsed.data;

  db.update(teachers)
    .set({ dbsStatus, dbsExpiry: dbsExpiry ?? null, rightToWork, complianceStatus, complianceNotes: complianceNotes ?? null })
    .where(eq(teachers.id, id))
    .run();

  return NextResponse.json({ ok: true });
}
