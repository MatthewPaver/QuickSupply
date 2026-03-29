import { Suspense } from "react";
import { db } from "@/lib/db";
import {
  coverRequests,
  assignmentOffers,
  bookings,
  teachers,
  schoolTeacherReviews,
  invoiceLineItems,
  invoices,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Clock, Users, Star, XCircle, PoundSterling } from "lucide-react";
import Link from "next/link";
import { AnalyticsDateFilter } from "@/components/agency/analytics-date-filter";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AgencyAnalyticsPage({ searchParams }: Props) {
  await requireSession("agent");

  const params = await searchParams;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}`;

  const fromDate = params.from ?? thirtyDaysAgoStr;
  const toDate = params.to ?? todayStr;

  const fromTimestamp = new Date(fromDate + "T00:00:00");
  const toTimestamp = new Date(toDate + "T23:59:59");

  // ── Fill Rate ──────────────────────────────────────────────
  const allRequests = db
    .select()
    .from(coverRequests)
    .where(
      and(
        sql`${coverRequests.date} >= ${fromDate}`,
        sql`${coverRequests.date} <= ${toDate}`
      )
    )
    .all();

  const nonCancelled = allRequests.filter((r) => r.status !== "cancelled");
  const filled = allRequests.filter((r) => r.status === "filled");
  const fillRate = nonCancelled.length > 0
    ? Math.round((filled.length / nonCancelled.length) * 100)
    : null;

  // ── Average Response Time ──────────────────────────────────
  const respondedOffers = db
    .select()
    .from(assignmentOffers)
    .where(
      and(
        sql`${assignmentOffers.status} IN ('accepted', 'declined')`,
        sql`${assignmentOffers.responseAt} IS NOT NULL`,
        sql`${assignmentOffers.offeredAt} >= ${fromTimestamp.getTime()}`,
        sql`${assignmentOffers.offeredAt} <= ${toTimestamp.getTime()}`
      )
    )
    .all();

  let avgResponseMinutes: number | null = null;
  let medianResponseMinutes: number | null = null;
  if (respondedOffers.length > 0) {
    const responseTimes = respondedOffers.map((o) => {
      const offered = o.offeredAt instanceof Date ? o.offeredAt.getTime() : Number(o.offeredAt);
      const responded = o.responseAt instanceof Date ? o.responseAt.getTime() : Number(o.responseAt);
      return (responded - offered) / 60000;
    });
    avgResponseMinutes = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
    const sorted = [...responseTimes].sort((a, b) => a - b);
    medianResponseMinutes = Math.round(sorted[Math.floor(sorted.length / 2)]);
  }

  // ── Teacher Utilization ────────────────────────────────────
  const activeTeachers = db
    .select()
    .from(teachers)
    .where(eq(teachers.isActive, true))
    .all();

  const periodBookings = db
    .select()
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(
      and(
        sql`${coverRequests.date} >= ${fromDate}`,
        sql`${coverRequests.date} <= ${toDate}`,
        sql`${bookings.cancelledAt} IS NULL`
      )
    )
    .all();

  const utilization = activeTeachers.length > 0
    ? (periodBookings.length / activeTeachers.length).toFixed(1)
    : null;

  // ── School Satisfaction ────────────────────────────────────
  const periodReviews = db
    .select()
    .from(schoolTeacherReviews)
    .where(
      and(
        sql`${schoolTeacherReviews.createdAt} >= ${fromTimestamp.getTime()}`,
        sql`${schoolTeacherReviews.createdAt} <= ${toTimestamp.getTime()}`
      )
    )
    .all();

  let avgRating: number | null = null;
  let rebookPct: number | null = null;
  if (periodReviews.length > 0) {
    avgRating = parseFloat(
      (periodReviews.reduce((sum, r) => sum + r.rating, 0) / periodReviews.length).toFixed(1)
    );
    const rebooks = periodReviews.filter((r) => r.wouldRebook).length;
    rebookPct = Math.round((rebooks / periodReviews.length) * 100);
  }

  // ── Cancellation Rate ──────────────────────────────────────
  const allPeriodBookings = db
    .select()
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(
      and(
        sql`${coverRequests.date} >= ${fromDate}`,
        sql`${coverRequests.date} <= ${toDate}`
      )
    )
    .all();

  const cancelledBookings = allPeriodBookings.filter((b) => b.bookings.cancelledAt !== null);
  const cancellationRate = allPeriodBookings.length > 0
    ? Math.round((cancelledBookings.length / allPeriodBookings.length) * 100)
    : null;

  // ── Gross Margin ───────────────────────────────────────────
  const periodLineItems = db
    .select()
    .from(invoiceLineItems)
    .innerJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .where(
      and(
        sql`${invoices.periodStart} <= ${toDate}`,
        sql`${invoices.periodEnd} >= ${fromDate}`
      )
    )
    .all();

  const totalRevenue = periodLineItems.reduce((sum, r) => sum + r.invoice_line_items.chargeAmount, 0);
  const totalPayCost = periodLineItems.reduce((sum, r) => sum + r.invoice_line_items.payAmount, 0);
  const grossMargin = totalRevenue - totalPayCost;
  const grossMarginFormatted = `\u00a3${(grossMargin / 100).toFixed(2)}`;

  return (
    <div className="space-y-6 qs-enter">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">Agency</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Performance metrics for {fromDate} to {toDate}
          </p>
        </div>
        <Suspense>
          <AnalyticsDateFilter />
        </Suspense>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Fill Rate */}
        <Link href={`/agency/analytics/fill-rate?from=${fromDate}&to=${toDate}`}>
          <Card className="qs-pop transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Fill Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {fillRate !== null ? (
                <>
                  <div className="text-3xl font-bold">{fillRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {filled.length} / {nonCancelled.length} requests
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No requests</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Avg Response Time */}
        <Link href={`/agency/analytics/response-time?from=${fromDate}&to=${toDate}`}>
          <Card className="qs-pop transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              {avgResponseMinutes !== null ? (
                <>
                  <div className="text-3xl font-bold">{avgResponseMinutes} min</div>
                  <p className="text-xs text-muted-foreground">
                    median: {medianResponseMinutes} min &middot; {respondedOffers.length} responses
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No offers</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Teacher Utilization */}
        <Link href={`/agency/analytics/utilization?from=${fromDate}&to=${toDate}`}>
          <Card className="qs-pop transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Teacher Utilization
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {utilization !== null ? (
                <>
                  <div className="text-3xl font-bold">{utilization}</div>
                  <p className="text-xs text-muted-foreground">
                    bookings/teacher &middot; {periodBookings.length} total
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No bookings</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* School Satisfaction */}
        <Link href={`/agency/analytics/satisfaction?from=${fromDate}&to=${toDate}`}>
          <Card className="qs-pop transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                School Satisfaction
              </CardTitle>
              <Star className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {avgRating !== null ? (
                <>
                  <div className="text-3xl font-bold">{avgRating} / 5</div>
                  <p className="text-xs text-muted-foreground">
                    {periodReviews.length} reviews &middot; {rebookPct}% rebook
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No reviews</p>
              )}
            </CardContent>
          </Card>
        </Link>

        {/* Cancellation Rate */}
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cancellation Rate
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {cancellationRate !== null ? (
              <>
                <div className="text-3xl font-bold">{cancellationRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {cancelledBookings.length} / {allPeriodBookings.length} bookings
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No bookings</p>
            )}
          </CardContent>
        </Card>

        {/* Gross Margin */}
        <Link href={`/agency/analytics/margins?from=${fromDate}&to=${toDate}`}>
          <Card className="qs-pop transition-colors hover:border-primary/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Gross Margin
              </CardTitle>
              <PoundSterling className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {periodLineItems.length > 0 ? (
                <>
                  <div className="text-3xl font-bold text-primary">
                    {grossMarginFormatted}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {periodLineItems.length} line items
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No invoices</p>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
