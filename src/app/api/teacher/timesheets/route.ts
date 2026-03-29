import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { db } from "@/lib/db";
import { timesheets, bookings, coverRequests, schools } from "@/lib/db/schema";
import { getSession } from "@/lib/auth";
import { validateBody } from "@/lib/api-validation";
import { timesheetSubmitSchema } from "@/lib/api-validation";
import { notifyAllAgents } from "@/lib/notifications";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const validation = await validateBody(request, timesheetSubmitSchema);
  if (!validation.success) return validation.response;

  const { bookingId, arrivalTime, departureTime, breakMinutes, notes } = validation.data;

  // Verify booking exists and belongs to this teacher
  const booking = db
    .select({
      id: bookings.id,
      teacherId: bookings.teacherId,
      coverRequestId: bookings.coverRequestId,
      cancelledAt: bookings.cancelledAt,
    })
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .get();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.teacherId !== session.userId) {
    return NextResponse.json({ error: "This booking does not belong to you" }, { status: 403 });
  }

  if (booking.cancelledAt) {
    return NextResponse.json({ error: "Cannot submit timesheet for a cancelled booking" }, { status: 400 });
  }

  // Check no existing timesheet for this booking
  const existing = db
    .select({ id: timesheets.id })
    .from(timesheets)
    .where(eq(timesheets.bookingId, bookingId))
    .get();

  if (existing) {
    return NextResponse.json({ error: "A timesheet has already been submitted for this booking" }, { status: 409 });
  }

  // Calculate total hours with validation
  const [ah, am] = arrivalTime.split(":").map(Number);
  const [dh, dm] = departureTime.split(":").map(Number);
  const arrivalMinutes = ah * 60 + am;
  const departureMinutes = dh * 60 + dm;

  if (departureMinutes <= arrivalMinutes) {
    return NextResponse.json({ error: "Departure time must be after arrival time" }, { status: 400 });
  }

  const totalMinutesBeforeBreak = departureMinutes - arrivalMinutes;
  if (breakMinutes >= totalMinutesBeforeBreak) {
    return NextResponse.json({ error: "Break duration cannot exceed total time" }, { status: 400 });
  }

  const totalMinutes = totalMinutesBeforeBreak - breakMinutes;
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  const now = new Date();
  const id = ulid();

  // Use unique constraint check — if a concurrent request already inserted, this will fail
  try {
    db.insert(timesheets)
      .values({
        id,
        bookingId,
        teacherId: session.userId,
        arrivalTime,
        departureTime,
        breakMinutes,
        totalHours,
        status: "submitted",
        submittedAt: now,
        notes: notes ?? null,
        createdAt: now,
      })
      .run();
  } catch (err) {
    // Handle unique constraint violation (concurrent duplicate submission)
    if (err instanceof Error && err.message.includes("UNIQUE constraint")) {
      return NextResponse.json({ error: "A timesheet has already been submitted for this booking" }, { status: 409 });
    }
    throw err;
  }

  // Get cover request details for the notification
  const coverRequest = db
    .select({ date: coverRequests.date, schoolId: coverRequests.schoolId })
    .from(coverRequests)
    .where(eq(coverRequests.id, booking.coverRequestId))
    .get();

  const school = coverRequest
    ? db.select({ name: schools.name }).from(schools).where(eq(schools.id, coverRequest.schoolId)).get()
    : null;

  notifyAllAgents(
    "reminder",
    "Timesheet submitted",
    `${session.name} submitted a timesheet for ${school?.name ?? "a booking"} on ${coverRequest?.date ?? "unknown date"} (${totalHours}h).`,
    "timesheet",
    id
  );

  return NextResponse.json({
    success: true,
    timesheet: { id, totalHours, status: "submitted" },
  });
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = db
    .select({
      id: timesheets.id,
      bookingId: timesheets.bookingId,
      arrivalTime: timesheets.arrivalTime,
      departureTime: timesheets.departureTime,
      breakMinutes: timesheets.breakMinutes,
      totalHours: timesheets.totalHours,
      status: timesheets.status,
      submittedAt: timesheets.submittedAt,
      disputeReason: timesheets.disputeReason,
      notes: timesheets.notes,
      date: coverRequests.date,
      startTime: coverRequests.startTime,
      endTime: coverRequests.endTime,
      schoolName: schools.name,
    })
    .from(timesheets)
    .innerJoin(bookings, eq(timesheets.bookingId, bookings.id))
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(eq(timesheets.teacherId, session.userId))
    .orderBy(desc(timesheets.submittedAt))
    .all();

  return NextResponse.json(rows);
}
