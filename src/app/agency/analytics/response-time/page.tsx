import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { assignmentOffers, teachers } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
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
import { Clock, ArrowLeft, Timer, BarChart3, Users } from "lucide-react";
import { AnalyticsDateFilter } from "@/components/agency/analytics-date-filter";
import { ResponseTimeChart } from "@/components/agency/charts/response-time-chart";
import { CsvDownloadButton } from "@/components/agency/csv-download-button";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

function formatMinutes(minutes: number): string {
  if (minutes < 1) return "<1 min";
  return `${Math.round(minutes)} min`;
}

export default async function ResponseTimePage({ searchParams }: Props) {
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

  // ── Query responded offers with teacher info ─────────────
  const respondedOffers = db
    .select({
      offerId: assignmentOffers.id,
      teacherId: assignmentOffers.teacherId,
      offeredAt: assignmentOffers.offeredAt,
      responseAt: assignmentOffers.responseAt,
      status: assignmentOffers.status,
      firstName: teachers.firstName,
      lastName: teachers.lastName,
    })
    .from(assignmentOffers)
    .innerJoin(teachers, eq(assignmentOffers.teacherId, teachers.id))
    .where(
      and(
        sql`${assignmentOffers.status} IN ('accepted', 'declined')`,
        sql`${assignmentOffers.responseAt} IS NOT NULL`,
        sql`${assignmentOffers.offeredAt} >= ${fromTimestamp.getTime()}`,
        sql`${assignmentOffers.offeredAt} <= ${toTimestamp.getTime()}`
      )
    )
    .all();

  // ── Calculate response times ─────────────────────────────
  const responseTimes = respondedOffers.map((o) => {
    const offered =
      o.offeredAt instanceof Date ? o.offeredAt.getTime() : Number(o.offeredAt);
    const responded =
      o.responseAt instanceof Date
        ? o.responseAt.getTime()
        : Number(o.responseAt);
    return (responded - offered) / 60000;
  });

  // ── Mean & Median ────────────────────────────────────────
  let meanMinutes: number | null = null;
  let medianMinutes: number | null = null;

  if (responseTimes.length > 0) {
    meanMinutes =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const sorted = [...responseTimes].sort((a, b) => a - b);
    medianMinutes = sorted[Math.floor(sorted.length / 2)];
  }

  // ── Distribution buckets ─────────────────────────────────
  const buckets = [
    { label: "< 5 min", min: 0, max: 5, count: 0 },
    { label: "5 - 15 min", min: 5, max: 15, count: 0 },
    { label: "15 - 30 min", min: 15, max: 30, count: 0 },
    { label: "30 - 60 min", min: 30, max: 60, count: 0 },
    { label: "> 60 min", min: 60, max: Infinity, count: 0 },
  ];

  for (const t of responseTimes) {
    for (const b of buckets) {
      if (t >= b.min && t < b.max) {
        b.count++;
        break;
      }
    }
  }

  // ── Per-teacher breakdown ────────────────────────────────
  const teacherMap = new Map<
    string,
    {
      id: string;
      name: string;
      totalResponses: number;
      accepted: number;
      totalTime: number;
    }
  >();

  for (let i = 0; i < respondedOffers.length; i++) {
    const offer = respondedOffers[i];
    const time = responseTimes[i];
    const existing = teacherMap.get(offer.teacherId);
    if (existing) {
      existing.totalResponses++;
      existing.totalTime += time;
      if (offer.status === "accepted") existing.accepted++;
    } else {
      teacherMap.set(offer.teacherId, {
        id: offer.teacherId,
        name: `${offer.firstName} ${offer.lastName}`,
        totalResponses: 1,
        accepted: offer.status === "accepted" ? 1 : 0,
        totalTime: time,
      });
    }
  }

  const teacherBreakdown = Array.from(teacherMap.values())
    .map((t) => ({
      ...t,
      avgTime: t.totalTime / t.totalResponses,
      acceptanceRate: Math.round((t.accepted / t.totalResponses) * 100),
    }))
    .sort((a, b) => a.avgTime - b.avgTime);

  return (
    <div className="space-y-6 qs-enter">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/agency/analytics"
            className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to Analytics
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
            Agency
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Response Time Metrics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Offer response analysis for {fromDate} to {toDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CsvDownloadButton
            data={teacherBreakdown.map((t) => ({
              Teacher: t.name,
              "Avg Response (min)": Math.round(t.avgTime),
              Responses: t.totalResponses,
              "Acceptance Rate (%)": t.acceptanceRate,
            }))}
            filename="response-time"
          />
          <Suspense>
            <AnalyticsDateFilter />
          </Suspense>
        </div>
      </div>

      {/* ── Summary Cards ───────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Mean Response Time
            </CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {meanMinutes !== null ? (
              <div className="text-3xl font-bold">
                {formatMinutes(meanMinutes)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No responses</p>
            )}
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Median Response Time
            </CardTitle>
            <Timer className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            {medianMinutes !== null ? (
              <div className="text-3xl font-bold">
                {formatMinutes(medianMinutes)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No responses</p>
            )}
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total Responses
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{responseTimes.length}</div>
            <p className="text-xs text-muted-foreground">
              in selected period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Response Time Chart ─────────────────────────────── */}
      {responseTimes.length > 0 && (
        <ResponseTimeChart
          data={buckets.map((b) => ({
            bucket: b.label,
            count: b.count,
            percentage:
              responseTimes.length > 0
                ? Math.round((b.count / responseTimes.length) * 100)
                : 0,
          }))}
        />
      )}

      {/* ── Distribution Table ──────────────────────────────── */}
      <Card className="qs-pop">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Response Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responseTimes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Bucket</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buckets.map((b) => (
                  <TableRow key={b.label}>
                    <TableCell className="font-medium">{b.label}</TableCell>
                    <TableCell className="text-right">{b.count}</TableCell>
                    <TableCell className="text-right">
                      {responseTimes.length > 0
                        ? Math.round((b.count / responseTimes.length) * 100)
                        : 0}
                      %
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No response data for this period.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Per-Teacher Breakdown ───────────────────────────── */}
      <Card className="qs-pop">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Teacher Breakdown
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {teacherBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Avg Response</TableHead>
                  <TableHead className="text-right">Responses</TableHead>
                  <TableHead className="text-right">Acceptance Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherBreakdown.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Link
                        href={`/agency/teachers/${t.id}`}
                        className="font-medium text-primary hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded"
                      >
                        {t.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMinutes(t.avgTime)}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.totalResponses}
                    </TableCell>
                    <TableCell className="text-right">
                      {t.acceptanceRate}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No teacher response data for this period.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
