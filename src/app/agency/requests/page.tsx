import { db } from "@/lib/db";
import { coverRequests, schools, assignmentOffers, teachers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { RequestsFilter } from "@/components/agency/requests-filter";

export default async function AgencyRequestsPage() {
  await requireSession("agent");

  const allRequests = db.select().from(coverRequests).orderBy(desc(coverRequests.createdAt)).all();
  const allSchools = db.select().from(schools).all();
  const schoolMap = Object.fromEntries(allSchools.map((s) => [s.id, { name: s.name }]));

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
  const offerMap = Object.fromEntries(activeOffers.map((o) => [o.requestId, o]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Requests</h1>
        <p className="text-muted-foreground">{allRequests.length} total requests</p>
      </div>

      <RequestsFilter requests={allRequests} schoolMap={schoolMap} offerMap={offerMap} />
    </div>
  );
}
