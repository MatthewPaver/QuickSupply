"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

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
  const [editingId, setEditingId] = useState<string | null>(null);

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
                  <div className="w-full">
                    <span className="font-medium text-destructive">Dispute reason: </span>
                    <span className="text-foreground">{ts.disputeReason}</span>
                    {editingId !== ts.id && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(ts.id)}
                        >
                          Edit &amp; Resubmit
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editingId === ts.id && (
                <ResubmitForm
                  timesheet={ts}
                  onCancel={() => setEditingId(null)}
                  onSuccess={() => setEditingId(null)}
                />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ResubmitForm({
  timesheet,
  onCancel,
  onSuccess,
}: {
  timesheet: TimesheetRow;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [arrivalTime, setArrivalTime] = useState(timesheet.arrivalTime);
  const [departureTime, setDepartureTime] = useState(timesheet.departureTime);
  const [breakMinutes, setBreakMinutes] = useState(timesheet.breakMinutes);
  const [notes, setNotes] = useState(timesheet.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/teacher/timesheets/${timesheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          arrivalTime,
          departureTime,
          breakMinutes,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to resubmit timesheet");
        return;
      }

      toast.success("Timesheet resubmitted successfully");
      onSuccess();
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-md border p-3">
      <p className="text-sm font-medium">Edit &amp; Resubmit Timesheet</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`arrival-${timesheet.id}`} className="text-xs">
            Arrival Time
          </Label>
          <Input
            id={`arrival-${timesheet.id}`}
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`departure-${timesheet.id}`} className="text-xs">
            Departure Time
          </Label>
          <Input
            id={`departure-${timesheet.id}`}
            type="time"
            value={departureTime}
            onChange={(e) => setDepartureTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`break-${timesheet.id}`} className="text-xs">
          Break (minutes)
        </Label>
        <Input
          id={`break-${timesheet.id}`}
          type="number"
          min={0}
          value={breakMinutes}
          onChange={(e) => setBreakMinutes(Number(e.target.value))}
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor={`notes-${timesheet.id}`} className="text-xs">
          Notes (optional)
        </Label>
        <Textarea
          id={`notes-${timesheet.id}`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Resubmitting\u2026" : "Resubmit"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
