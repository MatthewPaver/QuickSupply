import { db } from "@/lib/db";
import { timesheets, bookings, coverRequests, teachers, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TimesheetActions } from "@/components/agency/timesheet-actions";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "disputed", label: "Disputed" },
] as const;

export default async function AgencyTimesheetsPage({ searchParams }: PageProps) {
  await requireSession("agent");

  const params = await searchParams;
  const statusFilter = params.status ?? "submitted";

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

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <h1 className="text-2xl font-bold">Timesheets</h1>
        <p className="text-muted-foreground">
          {rows.length} timesheet{rows.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/agency/timesheets?status=${tab.value}`}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
              statusFilter === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No timesheets"
          description={
            statusFilter === "all"
              ? "No timesheets have been submitted yet."
              : `No ${statusFilter} timesheets found.`
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Arrival</TableHead>
                  <TableHead>Departure</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Total Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((ts) => (
                  <TableRow key={ts.id}>
                    <TableCell>
                      {format(new Date(ts.date), "EEE d MMM")}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/agency/teachers/${ts.teacherId}`}
                        className="font-medium text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none rounded-sm"
                      >
                        {ts.teacherFirstName} {ts.teacherLastName}
                      </Link>
                    </TableCell>
                    <TableCell>{ts.schoolName}</TableCell>
                    <TableCell>{ts.arrivalTime}</TableCell>
                    <TableCell>{ts.departureTime}</TableCell>
                    <TableCell>{ts.breakMinutes} min</TableCell>
                    <TableCell>{ts.totalHours.toFixed(1)}h</TableCell>
                    <TableCell>
                      <StatusBadge status={ts.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {ts.status === "submitted" ? (
                        <TimesheetActions
                          timesheetId={ts.id}
                          teacherName={`${ts.teacherFirstName} ${ts.teacherLastName}`}
                        />
                      ) : ts.status === "disputed" && ts.disputeReason ? (
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
                          {ts.disputeReason}
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
