import { db } from "@/lib/db";
import { activityLog, agents, teachers, schools } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface PageProps {
  searchParams: Promise<{ action?: string; page?: string }>;
}

const ACTION_LABELS: Record<string, string> = {
  offer_sent: "Offer Sent",
  offer_accepted: "Offer Accepted",
  offer_declined: "Offer Declined",
  offer_expired: "Offer Expired",
  booking_created: "Booking Created",
  booking_cancelled: "Booking Cancelled",
  teacher_created: "Teacher Created",
  teacher_updated: "Teacher Updated",
  school_created: "School Created",
  compliance_updated: "Compliance Updated",
  timesheet_approved: "Timesheet Approved",
  timesheet_disputed: "Timesheet Disputed",
  invoice_generated: "Invoice Generated",
  settings_changed: "Settings Changed",
};

const ENTITY_ROUTES: Record<string, string> = {
  assignment_offer: "/agency/requests",
  cover_request: "/agency/requests",
  booking: "/agency/bookings",
  teacher: "/agency/teachers",
  school: "/agency/schools",
  compliance_document: "/agency/compliance",
  timesheet: "/agency/timesheets",
  invoice: "/agency/invoices",
};

const ACTION_FILTERS = [
  { value: "all", label: "All actions" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "offer_accepted", label: "Offer Accepted" },
  { value: "offer_declined", label: "Offer Declined" },
  { value: "booking_created", label: "Booking Created" },
  { value: "booking_cancelled", label: "Booking Cancelled" },
  { value: "compliance_updated", label: "Compliance Updated" },
  { value: "timesheet_approved", label: "Timesheet Approved" },
  { value: "timesheet_disputed", label: "Timesheet Disputed" },
  { value: "invoice_generated", label: "Invoice Generated" },
  { value: "settings_changed", label: "Settings Changed" },
] as const;

const PAGE_SIZE = 50;

export default async function AgencyActivityPage({ searchParams }: PageProps) {
  await requireSession("agent");

  const params = await searchParams;
  const actionFilter = params.action ?? "all";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  // Build actor name lookup maps
  const allAgents = db
    .select({ id: agents.id, name: agents.name })
    .from(agents)
    .all();
  const agentNames = new Map(allAgents.map((a) => [a.id, a.name]));

  const allTeachers = db
    .select({ id: teachers.id, firstName: teachers.firstName, lastName: teachers.lastName })
    .from(teachers)
    .all();
  const teacherNames = new Map(
    allTeachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]),
  );

  const allSchools = db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .all();
  const schoolNames = new Map(allSchools.map((s) => [s.id, s.name]));

  // Query activity log
  const baseWhere =
    actionFilter !== "all"
      ? eq(activityLog.action, actionFilter as typeof activityLog.$inferSelect.action)
      : undefined;

  const totalCount = db
    .select({ count: sql<number>`count(*)` })
    .from(activityLog)
    .where(baseWhere)
    .get()?.count ?? 0;

  const entries = db
    .select()
    .from(activityLog)
    .where(baseWhere)
    .orderBy(desc(activityLog.createdAt))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE)
    .all();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  function getActorName(actorId: string, actorRole: string): string {
    if (actorRole === "agent") return agentNames.get(actorId) ?? "Unknown Agent";
    if (actorRole === "teacher") return teacherNames.get(actorId) ?? "Unknown Teacher";
    if (actorRole === "school") return schoolNames.get(actorId) ?? "Unknown School";
    return "System";
  }

  function getEntityLink(entityType: string, entityId: string): string | null {
    const base = ENTITY_ROUTES[entityType];
    if (!base) return null;
    if (entityType === "teacher" || entityType === "school") {
      return `${base}/${entityId}`;
    }
    // For other entity types, link to the list page
    return base;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">
          Audit trail of actions across the agency portal
        </p>
      </div>

      {/* Action filter tabs */}
      <div className="flex flex-wrap gap-2">
        {ACTION_FILTERS.map((f) => (
          <Link
            key={f.value}
            href={
              f.value === "all"
                ? "/agency/activity"
                : `/agency/activity?action=${f.value}`
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              actionFilter === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {totalCount} {totalCount === 1 ? "entry" : "entries"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {entries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon="clipboard-list"
                title="No activity yet"
                description="Actions performed across the portal will appear here."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="pr-6">Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const details = entry.details
                    ? (JSON.parse(entry.details) as Record<string, unknown>)
                    : null;
                  const entityLink = getEntityLink(entry.entityType, entry.entityId);
                  const detailSummary = details
                    ? Object.entries(details)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(", ")
                    : null;

                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="pl-6 text-xs text-muted-foreground whitespace-nowrap">
                        {format(entry.createdAt, "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {getActorName(entry.actorId, entry.actorRole)}
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-xs text-muted-foreground">
                        {detailSummary ?? "-"}
                      </TableCell>
                      <TableCell className="pr-6">
                        {entityLink ? (
                          <Link
                            href={entityLink}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {entry.entityType}/{entry.entityId.slice(0, 8)}...
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {entry.entityType}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/agency/activity?${new URLSearchParams({
                ...(actionFilter !== "all" ? { action: actionFilter } : {}),
                page: String(page - 1),
              }).toString()}`}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/agency/activity?${new URLSearchParams({
                ...(actionFilter !== "all" ? { action: actionFilter } : {}),
                page: String(page + 1),
              }).toString()}`}
              className="rounded-md bg-muted px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/80"
            >
              Load more
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
