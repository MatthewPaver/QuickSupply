import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  bookings,
  coverRequests,
  teachers,
  teacherAvailability,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Users, CalendarCheck, Percent } from "lucide-react";
import { AnalyticsDateFilter } from "@/components/agency/analytics-date-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { UtilizationChart } from "@/components/agency/charts/utilization-chart";
import { CsvDownloadButton } from "@/components/agency/csv-download-button";
import {
  eachDayOfInterval,
  parseISO,
  isWeekend,
  getDay,
  format,
} from "date-fns";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function TeacherUtilizationPage({ searchParams }: Props) {
  await requireSession("agent");

  const params = await searchParams;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");

  const fromDate = params.from ?? thirtyDaysAgoStr;
  const toDate = params.to ?? todayStr;

  // ── Active teachers ──────────────────────────────────────────
  const activeTeachers = db
    .select()
    .from(teachers)
    .where(eq(teachers.isActive, true))
    .all();

  if (activeTeachers.length === 0) {
    return (
      <div className="space-y-6 qs-enter">
        <Header fromDate={fromDate} toDate={toDate} csvData={[]} />
        <EmptyState
          icon="inbox"
          title="No active teachers"
          description="There are no active teachers in the system to calculate utilisation."
        />
      </div>
    );
  }

  // ── Period bookings per teacher ──────────────────────────────
  const periodBookings = db
    .select()
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(
      and(
        sql`${coverRequests.date} >= ${fromDate}`,
        sql`${coverRequests.date} <= ${toDate}`,
        sql`${bookings.cancelledAt} IS NULL`
      )
    )
    .all();

  // Count bookings per teacher
  const bookingsByTeacher = new Map<string, number>();
  for (const b of periodBookings) {
    const tid = b.bookings.teacherId;
    bookingsByTeacher.set(tid, (bookingsByTeacher.get(tid) ?? 0) + 1);
  }

  // ── Availability data ────────────────────────────────────────
  const availabilityRows = db
    .select()
    .from(teacherAvailability)
    .where(eq(teacherAvailability.isAvailable, true))
    .all();

  // Build availability counts per teacher
  const periodStart = parseISO(fromDate);
  const periodEnd = parseISO(toDate);
  const periodDays = eachDayOfInterval({ start: periodStart, end: periodEnd });
  const weekdaysInPeriod = periodDays.filter((d) => !isWeekend(d)).length;

  // Group availability rows by teacher
  const availByTeacher = new Map<
    string,
    { specific: Set<string>; recurringDays: Set<number> }
  >();
  for (const row of availabilityRows) {
    if (!availByTeacher.has(row.teacherId)) {
      availByTeacher.set(row.teacherId, {
        specific: new Set(),
        recurringDays: new Set(),
      });
    }
    const entry = availByTeacher.get(row.teacherId)!;
    if (row.isRecurring && row.dayOfWeek !== null) {
      entry.recurringDays.add(row.dayOfWeek);
    } else if (row.date) {
      entry.specific.add(row.date);
    }
  }

  function getAvailableDays(teacherId: string): number {
    const avail = availByTeacher.get(teacherId);
    if (!avail || (avail.specific.size === 0 && avail.recurringDays.size === 0)) {
      return weekdaysInPeriod;
    }

    let count = 0;
    for (const day of periodDays) {
      if (isWeekend(day)) continue;
      const dateStr = format(day, "yyyy-MM-dd");
      const dow = getDay(day);
      if (avail.specific.has(dateStr) || avail.recurringDays.has(dow)) {
        count++;
      }
    }
    return count;
  }

  // ── Build teacher rows ───────────────────────────────────────
  const teacherRows = activeTeachers
    .map((t) => {
      const booked = bookingsByTeacher.get(t.id) ?? 0;
      const available = getAvailableDays(t.id);
      const utilization =
        available > 0 ? Math.round((booked / available) * 100) : 0;
      return {
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
        bookings: booked,
        available,
        utilization,
      };
    })
    .sort((a, b) => b.utilization - a.utilization);

  // ── Summary stats ────────────────────────────────────────────
  const totalBookings = periodBookings.length;
  const avgUtilization =
    teacherRows.length > 0
      ? Math.round(
          teacherRows.reduce((sum, t) => sum + t.utilization, 0) /
            teacherRows.length
        )
      : 0;

  return (
    <div className="space-y-6 qs-enter">
      <Header
          fromDate={fromDate}
          toDate={toDate}
          csvData={teacherRows.map((row) => ({
            Teacher: row.name,
            Bookings: row.bookings,
            "Available Days": row.available,
            "Utilization (%)": row.utilization,
          }))}
        />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total Bookings
            </CardTitle>
            <CalendarCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              in selected period
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Active Teachers
            </CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeTeachers.length}</div>
            <p className="text-xs text-muted-foreground">
              on the roster
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Avg Utilisation
            </CardTitle>
            <Percent className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgUtilization}%</div>
            <p className="text-xs text-muted-foreground">
              across all teachers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Utilization Chart */}
      {teacherRows.length > 0 && (
        <UtilizationChart
          data={teacherRows.map((row) => ({
            name: row.name,
            utilization: row.utilization,
          }))}
        />
      )}

      {/* Teacher Table */}
      {teacherRows.length > 0 ? (
        <Card className="qs-pop">
          <CardHeader>
            <CardTitle className="text-base">Teacher Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Available Days</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/agency/teachers/${row.id}`}
                        className="font-medium text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{row.bookings}</TableCell>
                    <TableCell className="text-right">{row.available}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          row.utilization >= 75
                            ? "font-semibold text-emerald-600"
                            : row.utilization >= 40
                              ? "text-amber-600"
                              : "text-destructive"
                        }
                      >
                        {row.utilization}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon="inbox"
          title="No booking data"
          description="There are no bookings in the selected period to calculate utilisation."
        />
      )}
    </div>
  );
}

function Header({
  fromDate,
  toDate,
  csvData,
}: {
  fromDate: string;
  toDate: string;
  csvData: Record<string, string | number>[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Teacher Utilisation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Booking rates per teacher for {fromDate} to {toDate}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <CsvDownloadButton data={csvData} filename="teacher-utilization" />
        <Suspense>
          <AnalyticsDateFilter />
        </Suspense>
      </div>
    </div>
  );
}
