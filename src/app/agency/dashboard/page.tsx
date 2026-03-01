import { db } from "@/lib/db";
import { coverRequests, teachers, schools, assignmentOffers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { AgencyLiveRefresh } from "@/components/agency/agency-live-refresh";
import { SmsLogDrawer } from "@/components/agency/sms-log-drawer";

export default async function AgencyDashboard() {
  await requireSession("agent");

  const allRequests = db.select().from(coverRequests).orderBy(desc(coverRequests.createdAt)).all();
  const allSchools = db.select().from(schools).all();
  const allTeachers = db.select().from(teachers).all();

  const schoolMap = new Map(allSchools.map((s) => [s.id, s]));

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const pending = allRequests.filter((r) => r.status === "pending");
  const offering = allRequests.filter((r) => r.status === "offering");
  const filledToday = allRequests.filter((r) => r.status === "filled" && r.date === today);
  const emergencies = allRequests.filter((r) => r.isEmergency && (r.status === "pending" || r.status === "offering"));

  // Active offers with teacher info
  const activeOffers = db
    .select({
      offerId: assignmentOffers.id,
      requestId: assignmentOffers.coverRequestId,
      teacherId: assignmentOffers.teacherId,
      expiresAt: assignmentOffers.expiresAt,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(assignmentOffers)
    .innerJoin(teachers, eq(assignmentOffers.teacherId, teachers.id))
    .where(eq(assignmentOffers.status, "pending"))
    .all();

  const activeOfferMap = new Map(activeOffers.map((o) => [o.requestId, o]));

  return (
    <div className="space-y-6 qs-enter">
      <AgencyLiveRefresh />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">Agency Command Centre</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Agency Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Live overview of requests, offers, and capacity.</p>
        </div>
        <SmsLogDrawer />
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{pending.length}</div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Being Offered</CardTitle>
            <ArrowRight className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{offering.length}</div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{filledToday.length}</div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Emergencies</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{emergencies.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent / Active Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Active Requests</CardTitle>
          <Link href="/agency/requests">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {pending.length === 0 && offering.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No active requests"
              description="When schools submit cover requests, they will appear here. You can assign teachers from the Requests page."
              actionLabel="View All Requests"
              actionHref="/agency/requests"
            />
          ) : (
            <div className="space-y-3">
              {[...offering, ...pending].slice(0, 10).map((req) => {
                const school = schoolMap.get(req.schoolId);
                const activeOffer = activeOfferMap.get(req.id);
                return (
                  <Link key={req.id} href={`/agency/requests/${req.id}`}>
                    <div className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{school?.name || "Unknown School"}</span>
                          {req.isEmergency && (
                            <Badge variant="destructive" className="text-xs">EMERGENCY</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span className="capitalize">{req.roleNeeded}</span>
                          {req.subject && <span> - {req.subject}</span>}
                          {req.keyStage && <span> ({req.keyStage})</span>}
                          {" "}&middot; {format(new Date(req.date + "T00:00:00"), "EEE d MMM")} &middot; {req.startTime}
                        </div>
                        {activeOffer && (
                          <div className="text-sm text-blue-600">
                            Offering to: {activeOffer.teacherFirstName} {activeOffer.teacherLastName}
                          </div>
                        )}
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="qs-pop">
          <CardHeader>
            <CardTitle className="text-base">Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total registered</span>
                <span className="font-medium">{allTeachers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Compliant</span>
                <span className="font-medium text-green-600">
                  {allTeachers.filter((t) => t.complianceStatus === "compliant").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pending compliance</span>
                <span className="font-medium text-amber-600">
                  {allTeachers.filter((t) => t.complianceStatus === "pending").length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Expired compliance</span>
                <span className="font-medium text-red-600">
                  {allTeachers.filter((t) => t.complianceStatus === "expired").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader>
            <CardTitle className="text-base">Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total registered</span>
                <span className="font-medium">{allSchools.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active requests today</span>
                <span className="font-medium">
                  {allRequests.filter((r) => r.date === today && r.status !== "cancelled").length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
