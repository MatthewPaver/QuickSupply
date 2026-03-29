"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

interface TimesheetRow {
  id: string;
  bookingId: string;
  arrivalTime: string;
  departureTime: string;
  breakMinutes: number;
  totalHours: number;
  status: string;
  submittedAt: string;
  disputeReason: string | null;
  notes: string | null;
  date: string;
  startTime: string;
  endTime: string;
  schoolName: string;
}

export function TimesheetsList({ timesheets }: { timesheets: TimesheetRow[] }) {
  if (timesheets.length === 0) {
    return (
      <EmptyState
        icon="clipboard-list"
        title="No timesheets yet"
        description="After completing a booking, submit your timesheet from the Jobs page."
        actionLabel="Go to Jobs"
        actionHref="/teacher/jobs"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">All Timesheets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {timesheets.map((ts) => (
            <div
              key={ts.id}
              className="rounded-lg border bg-background p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{ts.schoolName}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(ts.date + "T00:00:00"), "EEEE d MMMM yyyy")}
                    {" "}&middot; {ts.arrivalTime} - {ts.departureTime}
                    {" "}&middot; {ts.totalHours}h
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Submitted {format(new Date(ts.submittedAt), "d MMM yyyy 'at' HH:mm")}
                  </div>
                </div>
                <StatusBadge status={ts.status} />
              </div>

              {ts.status === "disputed" && ts.disputeReason && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2.5 text-sm">
                  <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-destructive">Dispute reason: </span>
                    <span className="text-foreground">{ts.disputeReason}</span>
                    <div className="mt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/teacher/jobs`}>
                          Edit &amp; Resubmit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
