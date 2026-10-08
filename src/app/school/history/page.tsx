import { db } from "@/lib/db";
import { coverRequests, bookings, teachers, schoolTeacherReviews } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ReviewForm } from "@/components/school/review-form";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { roleLabel } from "@/lib/utils";

export default async function SchoolHistoryPage() {
  const session = await requireSession("school");

  const pastRequests = db
    .select()
    .from(coverRequests)
    .where(eq(coverRequests.schoolId, session.userId))
    .orderBy(desc(coverRequests.createdAt))
    .all()
    .filter((r) => r.status === "filled" || r.status === "cancelled");

  const allBookings = db
    .select({
      id: bookings.id,
      coverRequestId: bookings.coverRequestId,
      teacherId: bookings.teacherId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(bookings)
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .where(sql`${bookings.cancelledAt} IS NULL`)
    .all();

  const bookingMap = new Map(allBookings.map((b) => [b.coverRequestId, b]));

  const reviews = db
    .select()
    .from(schoolTeacherReviews)
    .where(eq(schoolTeacherReviews.schoolId, session.userId))
    .all();
  const reviewByBookingId = new Map(reviews.map((r) => [r.bookingId, r]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Request History</h1>
        <p className="text-muted-foreground">Filled and cancelled requests, newest first</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {pastRequests.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No history yet"
                description="Completed and cancelled requests will appear here."
                actionLabel="New Cover Request"
                actionHref="/school/requests/new"
                className="m-6"
              />
            ) : (
              pastRequests.map((req) => {
                const booking = bookingMap.get(req.id);
                const review = booking ? reviewByBookingId.get(booking.id) : null;
                return (
                  <div key={req.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{roleLabel(req.roleNeeded)}</span>
                          {req.subject && <span className="text-muted-foreground">- {req.subject}</span>}
                          {req.keyStage && (
                            <span className="text-xs rounded bg-muted px-2 py-0.5">{req.keyStage}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(req.date), "EEEE, d MMMM yyyy")} &middot; {req.startTime} - {req.endTime}
                        </div>
                        {booking && (
                          <>
                            <div className="text-sm">
                              Covered by: <span className="font-medium">{booking.teacherFirstName} {booking.teacherLastName}</span>
                            </div>
                            <ReviewForm
                              bookingId={booking.id}
                              teacherName={`${booking.teacherFirstName} ${booking.teacherLastName}`}
                              existingRating={review?.rating ?? null}
                              existingComment={review?.comment ?? null}
                              existingWouldRebook={review?.wouldRebook ?? null}
                            />
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {req.status === "filled" && (
                          <Link
                            href={`/school/requests/new?role=${encodeURIComponent(req.roleNeeded)}${req.keyStage ? `&keyStage=${encodeURIComponent(req.keyStage)}` : ""}&start=${encodeURIComponent(req.startTime)}&end=${encodeURIComponent(req.endTime)}${req.notes ? `&notes=${encodeURIComponent(req.notes)}` : ""}`}
                          >
                            <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-xs">
                              <RefreshCw className="h-3.5 w-3.5" />
                              Repeat
                            </Button>
                          </Link>
                        )}
                        <StatusBadge status={req.status} />
                      </div>
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
