import { db } from "@/lib/db";
import { coverRequests, assignmentOffers, bookings, teachers } from "@/lib/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileText, Plus, CheckCircle, Clock, CalendarDays } from "lucide-react";
import Link from "next/link";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { SchoolLiveRefresh } from "@/components/school/school-live-refresh";
import { roleLabel } from "@/lib/utils";

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
      .where(and(eq(assignmentOffers.status, "pending"), inArray(assignmentOffers.coverRequestId, activeRequestIds)))
      .all();
    pendingOffers.forEach((o) => {
      offeringToMap.set(o.coverRequestId, `${o.firstName} ${o.lastName}`);
    });
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const filledToday = requests.filter(
    (r) => r.status === "filled" && r.date === todayStr
  );
  const totalFilled = requests.filter((r) => r.status === "filled").length;

  // This-week stats
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const thisWeekRequests = requests.filter((r) => r.date >= weekStart && r.date <= weekEnd);
  const thisWeekFilled = thisWeekRequests.filter((r) => r.status === "filled").length;
  const thisWeekPending = thisWeekRequests.filter((r) => r.status === "pending" || r.status === "offering").length;

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
      .where(and(sql`${bookings.cancelledAt} IS NULL`, inArray(bookings.coverRequestId, filledRequestIds)))
      .all();
    covered.forEach((b) => coveredByMap.set(b.coverRequestId, `${b.firstName} ${b.lastName}`));
  }

  return (
    <div className="space-y-6 qs-enter">
      <SchoolLiveRefresh schoolId={session.userId} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">School Portal</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{session.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Log a cover request and follow it until a teacher accepts.</p>
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
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeRequests.length}</div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filled Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{filledToday.length}</div>
          </CardContent>
        </Card>
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Filled</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalFilled}</div>
          </CardContent>
        </Card>
      </div>

      {/* This Week Summary */}
      <Card className="qs-pop border-primary/20 bg-primary/[0.03]">
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold">This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{thisWeekRequests.length}</div>
              <div className="text-xs text-muted-foreground">Requests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{thisWeekFilled}</div>
              <div className="text-xs text-muted-foreground">Filled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{thisWeekPending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
          </div>
        </CardContent>
      </Card>

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
              description="When you log a cover request, the agency offers it to eligible teachers or TAs one at a time."
              actionLabel="New Cover Request"
              actionHref="/school/requests/new"
            />
          ) : (
            <div className="space-y-3">
              {activeRequests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{roleLabel(req.roleNeeded)}</span>
                      {req.subject && (
                        <span className="text-sm text-muted-foreground">- {req.subject}</span>
                      )}
                      {req.keyStage && (
                        <span className="text-xs rounded bg-muted px-2 py-0.5">{req.keyStage}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(req.date + "T00:00:00"), "EEE, d MMM yyyy")} &middot; {req.startTime} - {req.endTime}
                      {req.isEmergency && (
                        <span className="ml-2 text-xs font-semibold text-destructive">EMERGENCY</span>
                      )}
                    </div>
                    {req.status === "offering" && offeringToMap.get(req.id) && (
                      <div className="text-sm text-primary font-medium">
                        Offered to {offeringToMap.get(req.id)}, waiting for a reply
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
            <p className="py-6 text-center text-sm text-muted-foreground">Filled and cancelled requests will show here.</p>
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
                      <span className="font-medium">{roleLabel(req.roleNeeded)}</span>
                      {req.subject && <span> - {req.subject}</span>}
                      <span className="text-muted-foreground"> &middot; {format(new Date(req.date + "T00:00:00"), "d MMM")}</span>
                      {req.status === "filled" && coveredByMap.get(req.id) && (
                        <span className="block text-xs text-muted-foreground mt-0.5">
                          Covered by {coveredByMap.get(req.id)}
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
