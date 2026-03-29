import { db } from "@/lib/db";
import { assignmentOffers, bookings, coverRequests, schools, schoolTeacherReviews } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle, Star, TrendingUp, Building2 } from "lucide-react";
import { format } from "date-fns";

export default async function TeacherPerformance() {
  const session = await requireSession("teacher");

  // Total bookings completed (not cancelled)
  const completedBookings = db
    .select({
      id: bookings.id,
      coverRequestId: bookings.coverRequestId,
      confirmedAt: bookings.confirmedAt,
    })
    .from(bookings)
    .where(and(eq(bookings.teacherId, session.userId), sql`${bookings.cancelledAt} IS NULL`))
    .all();

  const totalCompleted = completedBookings.length;

  // Acceptance rate: accepted / (accepted + declined)
  const offerCounts = db
    .select({
      status: assignmentOffers.status,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(assignmentOffers)
    .where(eq(assignmentOffers.teacherId, session.userId))
    .groupBy(assignmentOffers.status)
    .all();

  const accepted = offerCounts.find((o) => o.status === "accepted")?.count ?? 0;
  const declined = offerCounts.find((o) => o.status === "declined")?.count ?? 0;
  const acceptanceRate = accepted + declined > 0
    ? Math.round((accepted / (accepted + declined)) * 100)
    : 0;

  // Average rating from school reviews
  const reviews = db
    .select({
      id: schoolTeacherReviews.id,
      rating: schoolTeacherReviews.rating,
      comment: schoolTeacherReviews.comment,
      schoolId: schoolTeacherReviews.schoolId,
      createdAt: schoolTeacherReviews.createdAt,
    })
    .from(schoolTeacherReviews)
    .where(eq(schoolTeacherReviews.teacherId, session.userId))
    .orderBy(desc(schoolTeacherReviews.createdAt))
    .all();

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  // Distinct schools worked at
  const distinctSchools = db
    .select({
      schoolId: coverRequests.schoolId,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(and(eq(bookings.teacherId, session.userId), sql`${bookings.cancelledAt} IS NULL`))
    .groupBy(coverRequests.schoolId)
    .all();

  const schoolCount = distinctSchools.length;

  // School name map for reviews
  const reviewSchoolIds = [...new Set(reviews.map((r) => r.schoolId))];
  const schoolNameMap = new Map<string, string>();
  if (reviewSchoolIds.length > 0) {
    const schoolRows = db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .all()
      .filter((s) => reviewSchoolIds.includes(s.id));
    for (const s of schoolRows) {
      schoolNameMap.set(s.id, s.name);
    }
  }

  // Booking history: last 10 bookings with date, school, hours
  const bookingHistory = db
    .select({
      bookingId: bookings.id,
      date: coverRequests.date,
      schoolName: schools.name,
      startTime: coverRequests.startTime,
      endTime: coverRequests.endTime,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(and(eq(bookings.teacherId, session.userId), sql`${bookings.cancelledAt} IS NULL`))
    .orderBy(desc(coverRequests.date))
    .all()
    .slice(0, 10);

  // Helper to calculate hours from HH:MM strings
  function calcHours(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    return Math.round(diff * 10) / 10;
  }

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <h1 className="text-2xl font-bold">Performance</h1>
        <p className="text-muted-foreground">Your stats and feedback from schools.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Bookings Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCompleted}</div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">{accepted} accepted, {declined} declined</p>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgRating > 0 ? avgRating : "—"}</div>
            <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Schools Worked At</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{schoolCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* School Reviews */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            School Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No reviews received yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">{schoolNameMap.get(r.schoolId) ?? "Unknown School"}</div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{r.rating}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(r.createdAt), "d MMM yyyy")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Booking History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Booking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookingHistory.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2 pr-4">School</th>
                    <th className="pb-2">Hours</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookingHistory.map((b) => (
                    <tr key={b.bookingId} className="transition-colors hover:bg-muted/30">
                      <td className="py-2.5 pr-4">{format(new Date(b.date + "T00:00:00"), "d MMM yyyy")}</td>
                      <td className="py-2.5 pr-4">{b.schoolName}</td>
                      <td className="py-2.5">{calcHours(b.startTime, b.endTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
