import { db } from "@/lib/db";
import { coverRequests, schools, assignmentOffers, teachers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { format } from "date-fns";

export default async function AgencyRequestsPage() {
  await requireSession("agent");

  const allRequests = db.select().from(coverRequests).orderBy(desc(coverRequests.createdAt)).all();
  const allSchools = db.select().from(schools).all();
  const schoolMap = new Map(allSchools.map((s) => [s.id, s]));

  const activeOffers = db
    .select({
      requestId: assignmentOffers.coverRequestId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(assignmentOffers)
    .innerJoin(teachers, eq(assignmentOffers.teacherId, teachers.id))
    .where(eq(assignmentOffers.status, "pending"))
    .all();
  const offerMap = new Map(activeOffers.map((o) => [o.requestId, o]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Requests</h1>
        <p className="text-muted-foreground">{allRequests.length} total requests</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {allRequests.map((req) => {
              const school = schoolMap.get(req.schoolId);
              const offer = offerMap.get(req.id);
              return (
                <Link key={req.id} href={`/agency/requests/${req.id}`}>
                  <div className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-muted/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{school?.name || "Unknown"}</span>
                        {req.isEmergency && (
                          <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <span className="capitalize">{req.roleNeeded}</span>
                        {req.subject && <span> - {req.subject}</span>}
                        {req.keyStage && <span> ({req.keyStage})</span>}
                        {" "}&middot; {format(new Date(req.date), "EEE d MMM yyyy")} &middot; {req.startTime} - {req.endTime}
                      </div>
                      {offer && (
                        <div className="text-sm text-blue-600">
                          Offering to: {offer.teacherFirstName} {offer.teacherLastName}
                        </div>
                      )}
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
