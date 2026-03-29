import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers, teacherSubjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, teacherSubjectsSchema } from "@/lib/api-validation";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const teacher = db.select({ id: teachers.id }).from(teachers).where(eq(teachers.id, id)).get();
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const subjects = db
    .select({ subject: teacherSubjects.subject })
    .from(teacherSubjects)
    .where(eq(teacherSubjects.teacherId, id))
    .all()
    .map((s) => s.subject);

  return NextResponse.json({ subjects });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const teacher = db.select({ id: teachers.id }).from(teachers).where(eq(teachers.id, id)).get();
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const parsed = await validateBody(request, teacherSubjectsSchema);
  if (!parsed.success) return parsed.response;

  // Delete existing subjects and insert new ones
  db.delete(teacherSubjects).where(eq(teacherSubjects.teacherId, id)).run();

  for (const subject of parsed.data.subjects) {
    db.insert(teacherSubjects)
      .values({ teacherId: id, subject })
      .run();
  }

  return NextResponse.json({ success: true, subjects: parsed.data.subjects });
}
