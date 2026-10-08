import { db } from "@/lib/db";
import { coverRequests, bookings, teachers, schoolTeacherReviews } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle, Clock, Star, BarChart3 } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { StatusBadge } from "@/components/shared/status-badge";
import { roleLabel } from "@/lib/utils";

export default async function SchoolAnalytics() {
  const session = await requireSession("school");

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");

  // All requests for this school
  const allRequests = db
    .select()
    .from(coverRequests)
    .where(eq(coverRequests.schoolId, session.userId))
    .all();

  const totalRequests = allRequests.length;
  const thisMonthRequests = allRequests.filter((r) => r.date >= monthStart).length;

  // Fill rate: filled / non-cancelled
  const nonCancelled = allRequests.filter((r) => r.status !== "cancelled");
  const filledRequests = allRequests.filter((r) => r.status === "filled");
  const fillRate = nonCancelled.length > 0
    ? Math.round((filledRequests.length / nonCancelled.length) * 100)
    : 0;

  // Average time to fill (request created → booking confirmed)
  const filledRequestIds = filledRequests.map((r) => r.id);
  let avgTimeToFillHours = 0;
  const allBookings = filledRequestIds.length > 0
    ? db
        .select({
          coverRequestId: bookings.coverRequestId,
          confirmedAt: bookings.confirmedAt,
          teacherId: bookings.teacherId,
          cancelledAt: bookings.cancelledAt,
        })
        .from(bookings)
        .where(sql`${bookings.cancelledAt} IS NULL`)
        .all()
        .filter((b) => filledRequestIds.includes(b.coverRequestId))
    : [];

  if (allBookings.length > 0) {
    const requestCreatedMap = new Map(allRequests.map((r) => [r.id, r.createdAt]));
    let totalMs = 0;
    let count = 0;
    for (const b of allBookings) {
      const createdAt = requestCreatedMap.get(b.coverRequestId);
      if (createdAt && b.confirmedAt) {
        totalMs += new Date(b.confirmedAt).getTime() - new Date(createdAt).getTime();
        count++;
      }
    }
    if (count > 0) {
      avgTimeToFillHours = Math.round(totalMs / count / (1000 * 60 * 60) * 10) / 10;
    }
  }

  // Reviews given count
  const reviewsGiven = db
    .select({ id: schoolTeacherReviews.id })
    .from(schoolTeacherReviews)
    .where(eq(schoolTeacherReviews.schoolId, session.userId))
    .all().length;

  // Recent bookings with teacher info
  const recentBookings = db
    .select({
      bookingId: bookings.id,
      date: coverRequests.date,
      firstName: teachers.firstName,
      lastName: teachers.lastName,
      roleNeeded: coverRequests.roleNeeded,
      status: coverRequests.status,
      cancelledAt: bookings.cancelledAt,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .where(eq(coverRequests.schoolId, session.userId))
    .orderBy(desc(coverRequests.date))
    .all()
    .slice(0, 10);

  // Top teachers: most bookings at this school with avg rating
  const teacherBookingCounts = db
    .select({
      teacherId: bookings.teacherId,
      firstName: teachers.firstName,
      lastName: teachers.lastName,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .where(and(eq(coverRequests.schoolId, session.userId), sql`${bookings.cancelledAt} IS NULL`))
    .groupBy(bookings.teacherId)
    .orderBy(sql`COUNT(*) DESC`)
    .all()
    .slice(0, 5);

  // Get avg ratings for top teachers from this school's reviews
  const topTeacherIds = teacherBookingCounts.map((t) => t.teacherId);
  const teacherRatings = new Map<string, { total: number; count: number }>();
  if (topTeacherIds.length > 0) {
    const reviews = db
      .select({
        teacherId: schoolTeacherReviews.teacherId,
        rating: schoolTeacherReviews.rating,
      })
      .from(schoolTeacherReviews)
      .where(eq(schoolTeacherReviews.schoolId, session.userId))
      .all();
    for (const r of reviews) {
      const existing = teacherRatings.get(r.teacherId) ?? { total: 0, count: 0 };
      existing.total += r.rating;
      existing.count += 1;
      teacherRatings.set(r.teacherId, existing);
    }
  }

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">School Portal</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance metrics for {session.name}.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">{thisMonthRequests} this month</p>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fill Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{fillRate}%</div>
            <p className="text-xs text-muted-foreground">{filledRequests.length} / {nonCancelled.length} filled</p>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg Time to Fill</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgTimeToFillHours}h</div>
            <p className="text-xs text-muted-foreground">request to booking</p>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reviews Given</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reviewsGiven}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recent Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">Teacher</th>
                    <th className="pb-2 pr-4">Role</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentBookings.map((b) => (
                    <tr key={b.bookingId} className="transition-colors hover:bg-muted/30">
                      <td className="py-2.5 pr-4">{format(new Date(b.date + "T00:00:00"), "d MMM yyyy")}</td>
                      <td className="py-2.5 pr-4">{b.firstName} {b.lastName}</td>
                      <td className="py-2.5 pr-4">{roleLabel(b.roleNeeded)}</td>
                      <td className="py-2.5">
                        {b.cancelledAt ? (
                          <StatusBadge status="cancelled" />
                        ) : (
                          <StatusBadge status={b.status} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Teachers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Teachers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teacherBookingCounts.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No completed bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {teacherBookingCounts.map((t) => {
                const ratingData = teacherRatings.get(t.teacherId);
                const avgRating = ratingData
                  ? Math.round((ratingData.total / ratingData.count) * 10) / 10
                  : null;
                return (
                  <div
                    key={t.teacherId}
                    className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                  >
                    <div>
                      <div className="text-sm font-semibold">{t.firstName} {t.lastName}</div>
                      <div className="text-xs text-muted-foreground">
                        {t.count} booking{t.count !== 1 ? "s" : ""}
                      </div>
                    </div>
                    {avgRating !== null && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{avgRating}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
