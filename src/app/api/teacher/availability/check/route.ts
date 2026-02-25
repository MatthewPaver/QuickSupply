import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { teacherAvailability, bookings, coverRequests } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * GET ?teacherId=...&date=YYYY-MM-DD
 * Returns { available: boolean } for use by school cover request form (previous teacher list).
 * School session required.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "school") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacherId = request.nextUrl.searchParams.get("teacherId");
  const date = request.nextUrl.searchParams.get("date");
  if (!teacherId || !date) {
    return NextResponse.json({ error: "Missing teacherId or date" }, { status: 400 });
  }

  const alreadyBooked = db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(
      and(
        eq(bookings.teacherId, teacherId),
        eq(coverRequests.date, date),
        sql`${bookings.cancelledAt} IS NULL`
      )
    )
    .get();
  if (alreadyBooked) {
    return NextResponse.json({ available: false });
  }

  const dayOfWeek = new Date(date + "T12:00:00").getDay();
  const availRows = db
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.teacherId, teacherId))
    .all();

  const specificDate = availRows.find((a) => !a.isRecurring && a.date === date);
  if (specificDate) {
    return NextResponse.json({ available: specificDate.isAvailable });
  }

  const recurring = availRows.find((a) => a.isRecurring && a.dayOfWeek === dayOfWeek);
  if (recurring) {
    return NextResponse.json({ available: recurring.isAvailable });
  }

  return NextResponse.json({ available: true });
}
