import { db } from "@/lib/db";
import { bookings, coverRequests, teachers, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { roleLabel } from "@/lib/utils";

export default async function AgencyBookingsPage() {
  await requireSession("agent");

  const allBookings = db
    .select({
      id: bookings.id,
      confirmedAt: bookings.confirmedAt,
      cancelledAt: bookings.cancelledAt,
      cancelledBy: bookings.cancelledBy,
      date: coverRequests.date,
      roleNeeded: coverRequests.roleNeeded,
      subject: coverRequests.subject,
      keyStage: coverRequests.keyStage,
      startTime: coverRequests.startTime,
      schoolName: schools.name,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .orderBy(desc(bookings.confirmedAt))
    .all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bookings</h1>
        <p className="text-muted-foreground">{allBookings.length} total bookings</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {allBookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between px-6 py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{b.schoolName}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span className="font-medium">{b.teacherFirstName} {b.teacherLastName}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span>{roleLabel(b.roleNeeded)}</span>
                    {b.subject && <span> - {b.subject}</span>}
                    {b.keyStage && <span> ({b.keyStage})</span>}
                    {" "}&middot; {format(new Date(b.date), "EEE d MMM")} &middot; {b.startTime}
                  </div>
                </div>
                {b.cancelledAt ? (
                  <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive">Cancelled</Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">Confirmed</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
