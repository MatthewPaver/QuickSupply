import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teacherAvailability } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { ulid } from "ulid";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const all = db
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.teacherId, session.userId))
    .all();

  const recurring = all.filter((a) => a.isRecurring);
  const specific = all.filter((a) => !a.isRecurring);

  return NextResponse.json({ recurring, specific });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { recurring, unavailableDates } = body as {
    recurring?: { dayOfWeek: number; isAvailable: boolean }[];
    unavailableDates?: string[];
  };

  if (!Array.isArray(recurring) || !Array.isArray(unavailableDates)) {
    return NextResponse.json({ error: "Missing recurring or unavailableDates arrays" }, { status: 400 });
  }

  // Delete existing availability for this teacher
  db.delete(teacherAvailability)
    .where(eq(teacherAvailability.teacherId, session.userId))
    .run();

  // Insert recurring patterns
  for (const r of recurring) {
    db.insert(teacherAvailability)
      .values({
        id: ulid(),
        teacherId: session.userId,
        dayOfWeek: r.dayOfWeek,
        isAvailable: r.isAvailable,
        isRecurring: true,
        createdAt: new Date(),
      })
      .run();
  }

  // Insert specific unavailable dates
  for (const dateStr of unavailableDates) {
    db.insert(teacherAvailability)
      .values({
        id: ulid(),
        teacherId: session.userId,
        date: dateStr,
        isAvailable: false,
        isRecurring: false,
        createdAt: new Date(),
      })
      .run();
  }

  return NextResponse.json({ ok: true });
}
