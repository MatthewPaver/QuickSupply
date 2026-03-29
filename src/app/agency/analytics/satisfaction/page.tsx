import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { schoolTeacherReviews, schools } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Star, MessageSquare, RefreshCw } from "lucide-react";
import { AnalyticsDateFilter } from "@/components/agency/analytics-date-filter";
import { EmptyState } from "@/components/shared/empty-state";
import { SatisfactionChart } from "@/components/agency/charts/satisfaction-chart";
import { CsvDownloadButton } from "@/components/agency/csv-download-button";
import { format } from "date-fns";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function SchoolSatisfactionPage({ searchParams }: Props) {
  await requireSession("agent");

  const params = await searchParams;
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);
  const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");

  const fromDate = params.from ?? thirtyDaysAgoStr;
  const toDate = params.to ?? todayStr;

  const fromTimestamp = new Date(fromDate + "T00:00:00");
  const toTimestamp = new Date(toDate + "T23:59:59");

  // ── Fetch reviews in period ──────────────────────────────────
  const periodReviews = db
    .select()
    .from(schoolTeacherReviews)
    .where(
      sql`${schoolTeacherReviews.createdAt} >= ${fromTimestamp.getTime()} AND ${schoolTeacherReviews.createdAt} <= ${toTimestamp.getTime()}`
    )
    .all();

  if (periodReviews.length === 0) {
    return (
      <div className="space-y-6 qs-enter">
        <Header fromDate={fromDate} toDate={toDate} csvData={[]} />
        <EmptyState
          icon="inbox"
          title="No reviews yet"
          description="There are no school reviews in the selected period."
        />
      </div>
    );
  }

  // ── Fetch all schools for name lookup ────────────────────────
  const allSchools = db.select().from(schools).all();
  const schoolMap = new Map(allSchools.map((s) => [s.id, s.name]));

  // ── Aggregate by school ──────────────────────────────────────
  const schoolAgg = new Map<
    string,
    { totalRating: number; count: number; rebooks: number }
  >();

  for (const review of periodReviews) {
    const existing = schoolAgg.get(review.schoolId);
    if (existing) {
      existing.totalRating += review.rating;
      existing.count += 1;
      if (review.wouldRebook) existing.rebooks += 1;
    } else {
      schoolAgg.set(review.schoolId, {
        totalRating: review.rating,
        count: 1,
        rebooks: review.wouldRebook ? 1 : 0,
      });
    }
  }

  const schoolRows = Array.from(schoolAgg.entries())
    .map(([schoolId, agg]) => ({
      id: schoolId,
      name: schoolMap.get(schoolId) ?? "Unknown School",
      avgRating: parseFloat((agg.totalRating / agg.count).toFixed(1)),
      reviewCount: agg.count,
      rebookPct: Math.round((agg.rebooks / agg.count) * 100),
    }))
    .sort((a, b) => b.avgRating - a.avgRating);

  // ── Overall summary ──────────────────────────────────────────
  const overallAvgRating = parseFloat(
    (
      periodReviews.reduce((sum, r) => sum + r.rating, 0) /
      periodReviews.length
    ).toFixed(1)
  );
  const overallRebookPct = Math.round(
    (periodReviews.filter((r) => r.wouldRebook).length /
      periodReviews.length) *
      100
  );

  return (
    <div className="space-y-6 qs-enter">
      <Header
        fromDate={fromDate}
        toDate={toDate}
        csvData={schoolRows.map((row) => ({
          School: row.name,
          "Avg Rating": row.avgRating,
          Reviews: row.reviewCount,
          "Rebook (%)": row.rebookPct,
        }))}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Avg Rating
            </CardTitle>
            <Star className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallAvgRating} / 5</div>
            <p className="text-xs text-muted-foreground">
              across all schools
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total Reviews
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{periodReviews.length}</div>
            <p className="text-xs text-muted-foreground">
              in selected period
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rebook Rate
            </CardTitle>
            <RefreshCw className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overallRebookPct}%</div>
            <p className="text-xs text-muted-foreground">
              would rebook the teacher
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Chart */}
      <SatisfactionChart
        data={schoolRows.map((row) => ({
          name: row.name,
          avgRating: row.avgRating,
          reviewCount: row.reviewCount,
        }))}
      />

      {/* School Table */}
      <Card className="qs-pop">
        <CardHeader>
          <CardTitle className="text-base">School Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead className="text-right">Avg Rating</TableHead>
                <TableHead className="text-right">Reviews</TableHead>
                <TableHead className="text-right">Rebook %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schoolRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/agency/schools/${row.id}`}
                      className="font-medium text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-sm"
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        row.avgRating >= 4
                          ? "font-semibold text-emerald-600"
                          : row.avgRating >= 3
                            ? "text-amber-600"
                            : "font-semibold text-destructive"
                      }
                    >
                      <Star className="mr-1 inline-block h-3.5 w-3.5 -translate-y-px" />
                      {row.avgRating}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{row.reviewCount}</TableCell>
                  <TableCell className="text-right">{row.rebookPct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Header({
  fromDate,
  toDate,
  csvData,
}: {
  fromDate: string;
  toDate: string;
  csvData: Record<string, string | number>[];
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
          Analytics
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          School Satisfaction
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review metrics by school for {fromDate} to {toDate}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <CsvDownloadButton data={csvData} filename="school-satisfaction" />
        <Suspense>
          <AnalyticsDateFilter />
        </Suspense>
      </div>
    </div>
  );
}
