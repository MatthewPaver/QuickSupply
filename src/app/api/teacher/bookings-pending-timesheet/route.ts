import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, coverRequests, schools, timesheets } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";

/**
 * GET /api/teacher/bookings-pending-timesheet
 * Returns active bookings (not cancelled) that don't yet have a timesheet.
 */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all non-cancelled bookings for this teacher
  const allBookings = db
    .select({
      bookingId: bookings.id,
      date: coverRequests.date,
      startTime: coverRequests.startTime,
      endTime: coverRequests.endTime,
      schoolName: schools.name,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(eq(bookings.teacherId, session.userId))
    .orderBy(desc(coverRequests.date))
    .all();

  // Filter out cancelled bookings and those that already have timesheets
  const result = allBookings.filter((b) => {
    // Check if booking is cancelled
    const booking = db
      .select({ cancelledAt: bookings.cancelledAt })
      .from(bookings)
      .where(eq(bookings.id, b.bookingId))
      .get();

    if (booking?.cancelledAt) return false;

    // Check if a timesheet already exists
    const ts = db
      .select({ id: timesheets.id })
      .from(timesheets)
      .where(eq(timesheets.bookingId, b.bookingId))
      .get();

    return !ts;
  });

  return NextResponse.json(result);
}
