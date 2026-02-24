import { db } from "@/lib/db";
import { assignmentOffers, coverRequests, bookings, schools, teachers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Briefcase, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";

export default async function TeacherDashboard() {
  const session = await requireSession("teacher");

  const teacher = db.select().from(teachers).where(eq(teachers.id, session.userId)).get();
  const today = new Date().toISOString().split("T")[0];

  // Active offers (pending)
  const activeOffers = db
    .select({
      offerId: assignmentOffers.id,
      requestId: assignmentOffers.coverRequestId,
      expiresAt: assignmentOffers.expiresAt,
      status: assignmentOffers.status,
      date: coverRequests.date,
      roleNeeded: coverRequests.roleNeeded,
      subject: coverRequests.subject,
      keyStage: coverRequests.keyStage,
      startTime: coverRequests.startTime,
      endTime: coverRequests.endTime,
      schoolName: schools.name,
      isEmergency: coverRequests.isEmergency,
    })
    .from(assignmentOffers)
    .innerJoin(coverRequests, eq(assignmentOffers.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(and(eq(assignmentOffers.teacherId, session.userId), eq(assignmentOffers.status, "pending")))
    .all();

  // Upcoming bookings
  const upcomingBookings = db
    .select({
      date: coverRequests.date,
      roleNeeded: coverRequests.roleNeeded,
      subject: coverRequests.subject,
      keyStage: coverRequests.keyStage,
      startTime: coverRequests.startTime,
      endTime: coverRequests.endTime,
      schoolName: schools.name,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(eq(bookings.teacherId, session.userId))
    .all()
    .filter((b) => b.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayBooking = upcomingBookings.find((b) => b.date === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {session.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground">
          {teacher?.emergencyAvailable ? "Emergency available" : "Standard availability"}
        </p>
      </div>

      {/* Active Offers - Most Important */}
      {activeOffers.length > 0 && (
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-primary">
              <AlertTriangle className="h-5 w-5" />
              Active Job Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeOffers.map((offer) => (
              <Link key={offer.offerId} href={`/teacher/jobs`}>
                <div className="rounded-lg border bg-white p-4 transition-colors hover:border-primary">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{offer.schoolName}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(offer.date), "EEE d MMM")} &middot; {offer.startTime} - {offer.endTime}
                      </div>
                      <div className="text-sm">
                        <span className="capitalize">{offer.roleNeeded}</span>
                        {offer.subject && <span> - {offer.subject}</span>}
                        {offer.keyStage && <span> ({offer.keyStage})</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      {offer.isEmergency && (
                        <Badge variant="destructive" className="mb-1">URGENT</Badge>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Expires {format(new Date(offer.expiresAt), "HH:mm")}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Today's Assignment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayBooking ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <div className="font-medium text-green-800 dark:text-green-200">{todayBooking.schoolName}</div>
              <div className="text-sm text-green-700 dark:text-green-300">
                {todayBooking.startTime} - {todayBooking.endTime} &middot;{" "}
                <span className="capitalize">{todayBooking.roleNeeded}</span>
                {todayBooking.subject && <span> - {todayBooking.subject}</span>}
              </div>
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">No assignment today.</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4" />
            Upcoming Bookings
          </CardTitle>
          <Link href="/teacher/jobs">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingBookings.filter((b) => b.date !== today).length === 0 ? (
            <EmptyState
              icon="briefcase"
              title="No upcoming bookings"
              description="When you accept an offer, it will appear here."
              actionLabel="View Job Offers"
              actionHref="/teacher/jobs"
            />
          ) : (
            <div className="space-y-2">
              {upcomingBookings
                .filter((b) => b.date !== today)
                .slice(0, 5)
                .map((b, i) => (
                  <div key={i} className="flex items-center justify-between rounded border p-3">
                    <div>
                      <div className="text-sm font-medium">{b.schoolName}</div>
                      <div className="text-xs text-muted-foreground">
                        <span className="capitalize">{b.roleNeeded}</span>
                        {b.subject && <span> - {b.subject}</span>}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(b.date), "EEE d MMM")} &middot; {b.startTime}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
