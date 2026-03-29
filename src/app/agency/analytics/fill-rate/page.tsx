import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { coverRequests } from "@/lib/db/schema";
import { and, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AnalyticsDateFilter } from "@/components/agency/analytics-date-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import { FillRateChart } from "@/components/agency/charts/fill-rate-chart";
import { CsvDownloadButton } from "@/components/agency/csv-download-button";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function FillRatePage({ searchParams }: Props) {
  await requireSession("agent");

  const params = await searchParams;
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const thirtyDaysAgoStr = `${thirtyDaysAgo.getFullYear()}-${String(thirtyDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(thirtyDaysAgo.getDate()).padStart(2, "0")}`;

  const fromDate = params.from ?? thirtyDaysAgoStr;
  const toDate = params.to ?? todayStr;

  // ── Query cover requests in date range ─────────────────────
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

  // Exclude cancelled from fill rate calculation
  const nonCancelled = allRequests.filter((r) => r.status !== "cancelled");
  const filled = nonCancelled.filter((r) => r.status === "filled");
  const unfilled = nonCancelled.filter((r) => r.status !== "filled");
  const overallFillRate =
    nonCancelled.length > 0
      ? Math.round((filled.length / nonCancelled.length) * 100)
      : null;

  // ── Group by date for daily breakdown ──────────────────────
  const dailyMap = new Map<
    string,
    { total: number; filled: number; unfilled: number }
  >();

  for (const req of nonCancelled) {
    const entry = dailyMap.get(req.date) ?? { total: 0, filled: 0, unfilled: 0 };
    entry.total += 1;
    if (req.status === "filled") {
      entry.filled += 1;
    } else {
      entry.unfilled += 1;
    }
    dailyMap.set(req.date, entry);
  }

  const dailyRows = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      ...data,
      fillRate: data.total > 0 ? Math.round((data.filled / data.total) * 100) : 0,
    }));

  const hasData = nonCancelled.length > 0;

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
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Fill Rate</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Daily fill rate breakdown for {format(parseISO(fromDate), "d MMM yyyy")} to{" "}
            {format(parseISO(toDate), "d MMM yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvDownloadButton
            data={dailyRows.map((row) => ({
              Date: format(parseISO(row.date), "yyyy-MM-dd"),
              Total: row.total,
              Filled: row.filled,
              Unfilled: row.unfilled,
              "Fill Rate (%)": row.fillRate,
            }))}
            filename="fill-rate"
          />
          <Suspense>
            <AnalyticsDateFilter />
          </Suspense>
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon="inbox"
          title="No requests in this period"
          description="There are no cover requests in the selected date range. Try adjusting the dates."
        />
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{nonCancelled.length}</div>
                <p className="text-xs text-muted-foreground">
                  excluding cancelled
                </p>
              </CardContent>
            </Card>

            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Filled
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {filled.length}
                </div>
              </CardContent>
            </Card>

            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Unfilled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">
                  {unfilled.length}
                </div>
              </CardContent>
            </Card>

            <Card className="qs-pop">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fill Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    overallFillRate !== null && overallFillRate >= 80
                      ? "text-emerald-600"
                      : "text-destructive"
                  }`}
                >
                  {overallFillRate ?? 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <FillRateChart
            data={dailyRows.map((row) => ({
              date: format(parseISO(row.date), "d MMM"),
              total: row.total,
              filled: row.filled,
              rate: row.fillRate,
            }))}
          />

          {/* Daily Breakdown Table */}
          <Card className="qs-pop">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Daily Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4 text-right">Total</th>
                      <th className="pb-2 pr-4 text-right">Filled</th>
                      <th className="pb-2 pr-4 text-right">Unfilled</th>
                      <th className="pb-2 text-right">Fill Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((row) => (
                      <tr
                        key={row.date}
                        className="border-b border-border/50 last:border-0"
                      >
                        <td className="py-2 pr-4 font-medium">
                          {format(parseISO(row.date), "EEE d MMM")}
                        </td>
                        <td className="py-2 pr-4 text-right">{row.total}</td>
                        <td className="py-2 pr-4 text-right text-emerald-600">
                          {row.filled}
                        </td>
                        <td className="py-2 pr-4 text-right text-destructive">
                          {row.unfilled}
                        </td>
                        <td
                          className={`py-2 text-right font-semibold ${
                            row.fillRate >= 80
                              ? "text-emerald-600"
                              : "text-destructive"
                          }`}
                        >
                          {row.fillRate}%
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
