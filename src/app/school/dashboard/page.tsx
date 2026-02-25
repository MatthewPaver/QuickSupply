import { db } from "@/lib/db";
import { coverRequests, assignmentOffers, bookings, teachers } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText, Plus, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolLiveRefresh } from "@/components/school/school-live-refresh";

export default async function SchoolDashboard() {
  const session = await requireSession("school");

  const requests = db
    .select()
    .from(coverRequests)
    .where(eq(coverRequests.schoolId, session.userId))
    .orderBy(desc(coverRequests.createdAt))
    .all();

  const activeRequests = requests.filter((r) => r.status === "pending" || r.status === "offering");
  const activeRequestIds = activeRequests.map((r) => r.id);

  // Who is each "offering" request currently offered to? (pending offer → teacher name)
  const offeringToMap = new Map<string, string>();
  if (activeRequestIds.length > 0) {
    const pendingOffers = db
      .select({
        coverRequestId: assignmentOffers.coverRequestId,
        firstName: teachers.firstName,
        lastName: teachers.lastName,
      })
      .from(assignmentOffers)
      .innerJoin(teachers, eq(assignmentOffers.teacherId, teachers.id))
      .where(and(eq(assignmentOffers.status, "pending")))
      .all();
    pendingOffers.forEach((o) => {
      if (activeRequestIds.includes(o.coverRequestId)) {
        offeringToMap.set(o.coverRequestId, `${o.firstName} ${o.lastName}`);
      }
    });
  }

  const filledToday = requests.filter(
    (r) => r.status === "filled" && r.date === new Date().toISOString().split("T")[0]
  );
  const totalFilled = requests.filter((r) => r.status === "filled").length;

  // For Recent History: who covered each filled request?
  const filledRequestIds = requests.filter((r) => r.status === "filled").map((r) => r.id);
  const coveredByMap = new Map<string, string>();
  if (filledRequestIds.length > 0) {
    const covered = db
      .select({
        coverRequestId: bookings.coverRequestId,
        firstName: teachers.firstName,
        lastName: teachers.lastName,
      })
      .from(bookings)
      .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
      .where(sql`${bookings.cancelledAt} IS NULL`)
      .all()
      .filter((b) => filledRequestIds.includes(b.coverRequestId));
    covered.forEach((b) => coveredByMap.set(b.coverRequestId, `${b.firstName} ${b.lastName}`));
  }

  return (
    <div className="space-y-6">
      <SchoolLiveRefresh schoolId={session.userId} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{session.name}</h1>
          <p className="text-muted-foreground">School Dashboard</p>
        </div>
        <Link href="/school/requests/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Cover Request
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filledToday.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Filled</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFilled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Active Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {activeRequests.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No active requests"
              description="Create a cover request and the agency will start finding a teacher or TA for you."
              actionLabel="New Cover Request"
              actionHref="/school/requests/new"
            />
          ) : (
            <div className="space-y-3">
              {activeRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{req.roleNeeded}</span>
                      {req.subject && (
                        <span className="text-sm text-muted-foreground">- {req.subject}</span>
                      )}
                      {req.keyStage && (
                        <span className="text-xs rounded bg-muted px-2 py-0.5">{req.keyStage}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(req.date), "EEE, d MMM yyyy")} &middot; {req.startTime} - {req.endTime}
                      {req.isEmergency && (
                        <span className="ml-2 text-xs font-semibold text-red-600">EMERGENCY</span>
                      )}
                    </div>
                    {req.status === "offering" && offeringToMap.get(req.id) && (
                      <div className="text-sm text-primary font-medium">
                        Offering to: {offeringToMap.get(req.id)}
                      </div>
                    )}
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent History</CardTitle>
          <Link href="/school/history">
            <Button variant="ghost" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {requests.filter((r) => r.status === "filled" || r.status === "cancelled").length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No past requests yet.</p>
          ) : (
            <div className="space-y-2">
              {requests
                .filter((r) => r.status === "filled" || r.status === "cancelled")
                .slice(0, 5)
                .map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded border px-4 py-3"
                  >
                    <div className="text-sm">
                      <span className="font-medium capitalize">{req.roleNeeded}</span>
                      {req.subject && <span> - {req.subject}</span>}
                      <span className="text-muted-foreground"> &middot; {format(new Date(req.date), "d MMM")}</span>
                      {req.status === "filled" && coveredByMap.get(req.id) && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Covered by: {coveredByMap.get(req.id)}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={req.status} />
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
