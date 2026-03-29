import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestTemplates } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/** DELETE: remove a request template (school must own it). */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "school") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const template = db
    .select()
    .from(requestTemplates)
    .where(eq(requestTemplates.id, id))
    .get();

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (template.schoolId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  db.delete(requestTemplates)
    .where(and(eq(requestTemplates.id, id), eq(requestTemplates.schoolId, session.userId)))
    .run();

  return NextResponse.json({ success: true });
}
