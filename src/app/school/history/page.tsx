import { db } from "@/lib/db";
import { coverRequests, bookings, teachers, schoolTeacherReviews } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Star } from "lucide-react";
import { format } from "date-fns";

export default async function SchoolHistoryPage() {
  const session = await requireSession("school");

  const pastRequests = db
    .select()
    .from(coverRequests)
    .where(eq(coverRequests.schoolId, session.userId))
    .orderBy(desc(coverRequests.createdAt))
    .all()
    .filter((r) => r.status === "filled" || r.status === "cancelled");

  // Get bookings with teacher info
  const allBookings = db
    .select({
      coverRequestId: bookings.coverRequestId,
      teacherId: bookings.teacherId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(bookings)
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .all();

  const bookingMap = new Map(allBookings.map((b) => [b.coverRequestId, b]));

  // Get existing reviews
  const reviews = db
    .select()
    .from(schoolTeacherReviews)
    .where(eq(schoolTeacherReviews.schoolId, session.userId))
    .all();

  const reviewMap = new Map(reviews.map((r) => [r.bookingId, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request History</h1>
        <p className="text-muted-foreground">Past cover requests and outcomes</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {pastRequests.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">
                No history yet.
              </p>
            ) : (
              pastRequests.map((req) => {
                const booking = bookingMap.get(req.id);
                return (
                  <div key={req.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">{req.roleNeeded}</span>
                          {req.subject && <span className="text-muted-foreground">- {req.subject}</span>}
                          {req.keyStage && (
                            <span className="text-xs rounded bg-muted px-2 py-0.5">{req.keyStage}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(req.date), "EEEE, d MMMM yyyy")} &middot; {req.startTime} - {req.endTime}
                        </div>
                        {booking && (
                          <div className="text-sm">
                            Covered by: <span className="font-medium">{booking.teacherFirstName} {booking.teacherLastName}</span>
                          </div>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
