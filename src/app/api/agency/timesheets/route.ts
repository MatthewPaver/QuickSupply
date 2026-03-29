import { NextRequest, NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { timesheets, bookings, coverRequests, teachers, schools } from "@/lib/db/schema";

/** GET: List all timesheets with full context, filterable by status. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const validStatuses = ["submitted", "approved", "disputed", "paid", "all"] as const;
  const rawStatus = searchParams.get("status") ?? "submitted";
  const statusFilter = validStatuses.includes(rawStatus as typeof validStatuses[number])
    ? rawStatus
    : "submitted";

  let query = db
    .select({
      id: timesheets.id,
      bookingId: timesheets.bookingId,
      teacherId: timesheets.teacherId,
      arrivalTime: timesheets.arrivalTime,
      departureTime: timesheets.departureTime,
      breakMinutes: timesheets.breakMinutes,
      totalHours: timesheets.totalHours,
      status: timesheets.status,
      submittedAt: timesheets.submittedAt,
      approvedAt: timesheets.approvedAt,
      disputeReason: timesheets.disputeReason,
      notes: timesheets.notes,
      date: coverRequests.date,
      schoolName: schools.name,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(timesheets)
    .innerJoin(bookings, eq(timesheets.bookingId, bookings.id))
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .innerJoin(teachers, eq(timesheets.teacherId, teachers.id))
    .orderBy(desc(timesheets.submittedAt))
    .$dynamic();

  if (statusFilter !== "all") {
    query = query.where(eq(timesheets.status, statusFilter as "submitted" | "approved" | "disputed" | "paid"));
  }

  const rows = query.all();

  return NextResponse.json({ success: true, timesheets: rows });
}
