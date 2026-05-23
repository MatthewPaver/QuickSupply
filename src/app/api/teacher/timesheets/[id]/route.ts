import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { timesheets, bookings, coverRequests, schools } from "@/lib/db/schema";
import { validateBody } from "@/lib/api-validation";
import { notifyAllAgents } from "@/lib/notifications";

const timesheetResubmitSchema = z.object({
  arrivalTime: z.string().regex(/^\d{2}:\d{2}$/, "arrivalTime must be HH:MM"),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/, "departureTime must be HH:MM"),
  breakMinutes: z.number().int().min(0, "Break minutes cannot be negative"),
  notes: z.string().max(500, "Notes must be 500 characters or fewer").nullable().optional(),
});

/** PATCH: Resubmit a disputed timesheet with corrected times. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Fetch the timesheet
  const timesheet = db
    .select()
    .from(timesheets)
    .where(eq(timesheets.id, id))
    .get();

  if (!timesheet) {
    return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  }

  // Only the owning teacher may resubmit
  if (timesheet.teacherId !== session.userId) {
    return NextResponse.json(
      { error: "This timesheet does not belong to you" },
      { status: 403 },
    );
  }

  // Only disputed timesheets can be resubmitted
  if (timesheet.status !== "disputed") {
    return NextResponse.json(
      { error: "Only disputed timesheets can be resubmitted" },
      { status: 400 },
    );
  }

  const parsed = await validateBody(request, timesheetResubmitSchema);
  if (!parsed.success) return parsed.response;

  const { arrivalTime, departureTime, breakMinutes, notes } = parsed.data;

  // Calculate total hours with validation
  const [ah, am] = arrivalTime.split(":").map(Number);
  const [dh, dm] = departureTime.split(":").map(Number);
  const arrivalMinutes = ah * 60 + am;
  const departureMinutes = dh * 60 + dm;

  if (departureMinutes <= arrivalMinutes) {
    return NextResponse.json(
      { error: "Departure time must be after arrival time" },
      { status: 400 },
    );
  }

  const totalMinutesBeforeBreak = departureMinutes - arrivalMinutes;
  if (breakMinutes >= totalMinutesBeforeBreak) {
    return NextResponse.json(
      { error: "Break duration cannot exceed total time" },
      { status: 400 },
    );
  }

  const totalMinutes = totalMinutesBeforeBreak - breakMinutes;
  const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

  const now = new Date();

  db.update(timesheets)
    .set({
      arrivalTime,
      departureTime,
      breakMinutes,
      totalHours,
      status: "submitted",
      submittedAt: now,
      disputeReason: null,
      notes: notes ?? null,
    })
    .where(and(eq(timesheets.id, id), eq(timesheets.status, "disputed")))
    .run();

  // Build a useful notification message
  const booking = db
    .select({ coverRequestId: bookings.coverRequestId })
    .from(bookings)
    .where(eq(bookings.id, timesheet.bookingId))
    .get();

  const coverRequest = booking
    ? db
        .select({ date: coverRequests.date, schoolId: coverRequests.schoolId })
        .from(coverRequests)
        .where(eq(coverRequests.id, booking.coverRequestId))
        .get()
    : null;

  const school = coverRequest
    ? db
        .select({ name: schools.name })
        .from(schools)
        .where(eq(schools.id, coverRequest.schoolId))
        .get()
    : null;

  notifyAllAgents(
    "reminder",
    "Timesheet resubmitted",
    `${session.name} resubmitted a disputed timesheet for ${school?.name ?? "a booking"} on ${coverRequest?.date ?? "unknown date"} (${totalHours}h).`,
    "timesheet",
    id,
  );

  return NextResponse.json({
    success: true,
    timesheet: { id, totalHours, status: "submitted" },
  });
}
