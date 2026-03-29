"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { Loader2, ClipboardList, Check } from "lucide-react";

interface TimesheetFormProps {
  bookingId: string;
  date: string;
  schoolName: string;
  startTime: string;
  endTime: string;
}

interface SubmittedTimesheet {
  id: string;
  totalHours: number;
  status: string;
}

export function TimesheetForm({ bookingId, date, schoolName, startTime, endTime }: TimesheetFormProps) {
  const [arrivalTime, setArrivalTime] = useState(startTime);
  const [departureTime, setDepartureTime] = useState(endTime);
  const [breakMinutes, setBreakMinutes] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<SubmittedTimesheet | null>(null);

  const calculatedHours = useMemo(() => {
    if (!arrivalTime || !departureTime) return null;
    const [ah, am] = arrivalTime.split(":").map(Number);
    const [dh, dm] = departureTime.split(":").map(Number);
    if (isNaN(ah) || isNaN(am) || isNaN(dh) || isNaN(dm)) return null;
    const totalMinutes = (dh * 60 + dm) - (ah * 60 + am) - breakMinutes;
    if (totalMinutes <= 0) return null;
    return Math.round((totalMinutes / 60) * 100) / 100;
  }, [arrivalTime, departureTime, breakMinutes]);

  const validationError = useMemo(() => {
    if (!arrivalTime || !departureTime) return null;
    if (departureTime <= arrivalTime) return "Departure must be after arrival";
    const [ah, am] = arrivalTime.split(":").map(Number);
    const [dh, dm] = departureTime.split(":").map(Number);
    const totalMinutes = (dh * 60 + dm) - (ah * 60 + am);
    if (breakMinutes > totalMinutes) return "Break exceeds total working time";
    return null;
  }, [arrivalTime, departureTime, breakMinutes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/timesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          arrivalTime,
          departureTime,
          breakMinutes,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Timesheet submitted successfully.");
        setSubmitted(data.timesheet);
      } else {
        toast.error(data.error || "Failed to submit timesheet.");
      }
    } catch {
      toast.error("Failed to submit timesheet. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Check className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold">Timesheet Submitted</h3>
              <p className="text-sm text-muted-foreground">{schoolName} &middot; {date}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Arrival: </span>
              <span className="font-medium">{arrivalTime}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Departure: </span>
              <span className="font-medium">{departureTime}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Break: </span>
              <span className="font-medium">{breakMinutes} min</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-medium">{submitted.totalHours}h</span>
            </div>
          </div>
          <div className="mt-3">
            <StatusBadge status="submitted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4" />
          Submit Timesheet
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {schoolName} &middot; {date}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`arrival-${bookingId}`}>Arrival Time</Label>
              <Input
                id={`arrival-${bookingId}`}
                type="time"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`departure-${bookingId}`}>Departure Time</Label>
              <Input
                id={`departure-${bookingId}`}
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`break-${bookingId}`}>Break (minutes)</Label>
            <Input
              id={`break-${bookingId}`}
              type="number"
              min={0}
              step={1}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`notes-${bookingId}`}>Notes (optional)</Label>
            <Textarea
              id={`notes-${bookingId}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this day..."
              maxLength={500}
              rows={2}
            />
          </div>

          {/* Live total hours display */}
          {calculatedHours !== null && !validationError && (
            <div className="rounded-lg border border-secondary/30 bg-secondary/5 px-4 py-2.5 text-sm">
              <span className="text-muted-foreground">Total hours: </span>
              <span className="font-semibold text-secondary">{calculatedHours}h</span>
            </div>
          )}

          {validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}

          <Button type="submit" disabled={submitting || !!validationError} className="w-full">
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ClipboardList className="mr-2 h-4 w-4" />
            )}
            Submit Timesheet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
