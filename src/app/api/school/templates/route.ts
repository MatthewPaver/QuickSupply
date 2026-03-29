import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { requestTemplates } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { validateBody, createTemplateSchema } from "@/lib/api-validation";

/** GET: list all templates for the authenticated school. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "school") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = db
    .select()
    .from(requestTemplates)
    .where(eq(requestTemplates.schoolId, session.userId))
    .orderBy(desc(requestTemplates.createdAt))
    .all();

  return NextResponse.json({ templates });
}

/** POST: create a new request template. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "school") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, createTemplateSchema);
  if (!parsed.success) return parsed.response;

  const { name, roleNeeded, subject, keyStage, startTime, endTime, notes } = parsed.data;

  const id = ulid();
  db.insert(requestTemplates)
    .values({
      id,
      schoolId: session.userId,
      name,
      roleNeeded,
      subject: subject ?? null,
      keyStage: keyStage ?? null,
      startTime,
      endTime,
      notes: notes ?? null,
      createdAt: new Date(),
    })
    .run();

  return NextResponse.json({ success: true, id });
}
