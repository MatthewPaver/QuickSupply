import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  invoiceLineItems,
  invoices,
  timesheets,
  bookings,
  coverRequests,
  teachers,
  schools,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnalyticsDateFilter } from "@/components/agency/analytics-date-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, PoundSterling, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function formatPence(pence: number): string {
  return `\u00a3${(pence / 100).toFixed(2)}`;
}

export default async function MarginsPage({ searchParams }: Props) {
  await requireSession("agent");

  const params = await searchParams;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}`;

  const fromDate = params.from ?? thirtyDaysAgoStr;
  const toDate = params.to ?? todayStr;

  // ── Query invoice line items joined through to schools & teachers ──
  const rows = db
    .select({
      lineId: invoiceLineItems.id,
      hours: invoiceLineItems.hours,
      payAmount: invoiceLineItems.payAmount,
      chargeAmount: invoiceLineItems.chargeAmount,
      schoolId: schools.id,
      schoolName: schools.name,
      teacherId: teachers.id,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(invoiceLineItems)
    .innerJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
    .innerJoin(timesheets, eq(invoiceLineItems.timesheetId, timesheets.id))
    .innerJoin(bookings, eq(timesheets.bookingId, bookings.id))
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .innerJoin(teachers, eq(timesheets.teacherId, teachers.id))
    .where(
      and(
        sql`${invoices.periodStart} <= ${toDate}`,
        sql`${invoices.periodEnd} >= ${fromDate}`
      )
    )
    .all();

  const hasData = rows.length > 0;

  // ── Aggregate metrics ──────────────────────────────────────
  const totalRevenue = rows.reduce((sum, r) => sum + r.chargeAmount, 0);
  const totalPayCost = rows.reduce((sum, r) => sum + r.payAmount, 0);
  const grossMargin = totalRevenue - totalPayCost;
  const marginPct = totalRevenue > 0
    ? Math.round(((totalRevenue - totalPayCost) / totalRevenue) * 100)
    : null;

  // ── Per-school breakdown ───────────────────────────────────
  const schoolMap = new Map<
    string,
    { schoolId: string; schoolName: string; revenue: number; cost: number }
  >();
  for (const row of rows) {
    const entry = schoolMap.get(row.schoolId) ?? {
      schoolId: row.schoolId,
      schoolName: row.schoolName,
      revenue: 0,
      cost: 0,
    };
    entry.revenue += row.chargeAmount;
    entry.cost += row.payAmount;
    schoolMap.set(row.schoolId, entry);
  }
  const schoolRows = Array.from(schoolMap.values())
    .map((s) => ({
      ...s,
      margin: s.revenue - s.cost,
      marginPct: s.revenue > 0 ? Math.round(((s.revenue - s.cost) / s.revenue) * 100) : 0,
    }))
    .sort((a, b) => b.margin - a.margin);

  // ── Per-teacher breakdown ──────────────────────────────────
  const teacherMap = new Map<
    string,
    { teacherId: string; teacherName: string; totalHours: number; payCost: number }
  >();
  for (const row of rows) {
    const entry = teacherMap.get(row.teacherId) ?? {
      teacherId: row.teacherId,
      teacherName: `${row.teacherFirstName} ${row.teacherLastName}`,
      totalHours: 0,
      payCost: 0,
    };
    entry.totalHours += row.hours;
    entry.payCost += row.payAmount;
    teacherMap.set(row.teacherId, entry);
  }
  const teacherRows = Array.from(teacherMap.values())
    .sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="space-y-6 qs-enter">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/agency/analytics"
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded"
          >
            <ArrowLeft className="h-3 w-3" />
            Analytics
          </Link>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Margin Tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Revenue, cost, and margin breakdown for{" "}
            {format(parseISO(fromDate), "d MMM yyyy")} to{" "}
            {format(parseISO(toDate), "d MMM yyyy")}
          </p>
        </div>
        <Suspense>
          <AnalyticsDateFilter />
        </Suspense>
      </div>

      {!hasData ? (
        <EmptyState
          icon="inbox"
          title="No invoice data in this period"
          description="There are no invoiced line items in the selected date range. Try adjusting the dates."
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Revenue
                </CardTitle>
                <PoundSterling className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {formatPence(totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  total charge amount
                </p>
              </CardContent>
            </Card>

            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pay Cost
                </CardTitle>
                <PoundSterling className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-500">
                  {formatPence(totalPayCost)}
                </div>
                <p className="text-xs text-muted-foreground">
                  total pay amount
                </p>
              </CardContent>
            </Card>

            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Gross Margin
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatPence(grossMargin)}
                </div>
                <p className="text-xs text-muted-foreground">
                  revenue minus cost
                </p>
              </CardContent>
            </Card>

            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Margin %
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    marginPct !== null && marginPct >= 20
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
                  {marginPct ?? 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  gross margin as % of revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Per-School Breakdown */}
          <Card className="qs-pop">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Per-School Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4">School</th>
                      <th className="pb-2 pr-4 text-right">Revenue</th>
                      <th className="pb-2 pr-4 text-right">Cost</th>
                      <th className="pb-2 pr-4 text-right">Margin</th>
                      <th className="pb-2 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolRows.map((row) => (
                      <tr
                        key={row.schoolId}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 pr-4 font-medium">
                          <Link
                            href={`/agency/schools/${row.schoolId}`}
                            className="text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded"
                          >
                            {row.schoolName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-right text-emerald-600">
                          {formatPence(row.revenue)}
                        </td>
                        <td className="py-2 pr-4 text-right text-amber-500">
                          {formatPence(row.cost)}
                        </td>
                        <td className="py-2 pr-4 text-right font-semibold text-primary">
                          {formatPence(row.margin)}
                        </td>
                        <td
                          className={`py-2 text-right font-semibold ${
                            row.marginPct >= 20
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        >
                          {row.marginPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Per-Teacher Breakdown */}
          <Card className="qs-pop">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Per-Teacher Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4">Teacher</th>
                      <th className="pb-2 pr-4 text-right">Hours</th>
                      <th className="pb-2 text-right">Pay Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherRows.map((row) => (
                      <tr
                        key={row.teacherId}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 pr-4 font-medium">
                          <Link
                            href={`/agency/teachers/${row.teacherId}`}
                            className="text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded"
                          >
                            {row.teacherName}
                          </Link>
                        </td>
                        <td className="py-2 pr-4 text-right">
                          {row.totalHours.toFixed(1)}
                        </td>
                        <td className="py-2 text-right text-amber-500">
                          {formatPence(row.payCost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
