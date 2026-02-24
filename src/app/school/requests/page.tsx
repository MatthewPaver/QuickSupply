import { db } from "@/lib/db";
import { coverRequests, bookings, teachers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";

export default async function SchoolRequestsPage() {
  const session = await requireSession("school");

  const requests = db
    .select()
    .from(coverRequests)
    .where(eq(coverRequests.schoolId, session.userId))
    .orderBy(desc(coverRequests.createdAt))
    .all();

  // Get bookings for filled requests where school requested a specific teacher
  const filledRequestIds = requests
    .filter((r) => r.status === "filled" && r.preferredTeacherId)
    .map((r) => r.id);

  const bookingData = filledRequestIds.length > 0
    ? db
        .select({
          coverRequestId: bookings.coverRequestId,
          teacherFirstName: teachers.firstName,
          teacherLastName: teachers.lastName,
        })
        .from(bookings)
        .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
        .all()
        .filter((b) => filledRequestIds.includes(b.coverRequestId))
    : [];

  const bookingMap = new Map(bookingData.map((b) => [b.coverRequestId, b]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All Requests</h1>
          <p className="text-muted-foreground">{requests.length} total requests</p>
        </div>
        <Link href="/school/requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Request
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {requests.length === 0 ? (
              <EmptyState
                icon="file-text"
                title="No requests yet"
                description="Submit your first cover request and the agency will find cover for you."
                actionLabel="New Cover Request"
                actionHref="/school/requests/new"
              />
            ) : (
              requests.map((req) => {
                const booking = bookingMap.get(req.id);
                return (
                  <div key={req.id} className="flex items-center justify-between px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{req.roleNeeded}</span>
                        {req.subject && (
                          <span className="text-muted-foreground">- {req.subject}</span>
                        )}
                        {req.keyStage && (
                          <span className="text-xs rounded bg-muted px-2 py-0.5">{req.keyStage}</span>
                        )}
                        {req.isEmergency && (
                          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">EMERGENCY</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(req.date), "EEEE, d MMMM yyyy")} &middot; {req.startTime} - {req.endTime}
                      </div>
                      {req.status === "filled" && booking && req.preferredTeacherId && (
                        <div className="text-sm text-green-700">
                          Assigned: {booking.teacherFirstName} {booking.teacherLastName}
                        </div>
                      )}
                      {req.status === "filled" && !req.preferredTeacherId && (
                        <div className="text-sm text-green-700">Cover Arranged</div>
                      )}
                      {req.notes && (
                        <div className="text-xs text-muted-foreground italic">{req.notes}</div>
                      )}
                    </div>
                    <StatusBadge status={req.status} />
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
