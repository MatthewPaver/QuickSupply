import { db } from "@/lib/db";
import { timesheets, bookings, coverRequests, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { TimesheetsList } from "@/components/teacher/timesheets-list";

export default async function TeacherTimesheetsPage() {
  const session = await requireSession("teacher");

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

  // Serialize timestamps for the client component
  const serialized = rows.map((r) => ({
    ...r,
    submittedAt: r.submittedAt.toISOString(),
  }));

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">Teacher Portal</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Timesheets</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "timesheet" : "timesheets"} submitted.
        </p>
      </div>

      <TimesheetsList timesheets={serialized} />
    </div>
  );
}
