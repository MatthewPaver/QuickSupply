"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isBefore, startOfDay } from "date-fns";
import { TemplateSelector } from "@/components/school/template-selector";

interface PreviousTeacher {
  id: string;
  firstName: string;
  lastName: string;
  roleType: string;
}

interface Props {
  schoolId: string;
  previousTeachers: PreviousTeacher[];
}

// Primary years only (EYFS + Year 1–6) per product focus
const YEAR_GROUPS = ["EYFS", "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6"];

export function CoverRequestForm({ schoolId, previousTeachers }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [roleNeeded, setRoleNeeded] = useState<string>("");
  const [keyStage, setKeyStage] = useState<string>("");
  const [startTime, setStartTime] = useState("08:30");
  const [endTime, setEndTime] = useState("15:30");
  const [notes, setNotes] = useState("");
  const [preferredTeacherId, setPreferredTeacherId] = useState<string>("");
  // Explicit emergency flag: schools can mark any request as emergency (e.g. urgent future date)
  const [isEmergency, setIsEmergency] = useState(false);
  // Teacher IDs that are unavailable on the selected date (for previous-teacher list)
  const [unavailableOnDate, setUnavailableOnDate] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [showRequiredHint, setShowRequiredHint] = useState(false);

  // Pre-fill from query params (e.g. "Repeat" button on history page)
  useEffect(() => {
    const role = searchParams.get("role");
    const ks = searchParams.get("keyStage");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const n = searchParams.get("notes");

    if (role && (role === "teacher" || role === "ta")) setRoleNeeded(role);
    if (ks) setKeyStage(ks);
    if (start && /^\d{2}:\d{2}$/.test(start)) setStartTime(start);
    if (end && /^\d{2}:\d{2}$/.test(end)) setEndTime(end);
    if (n) setNotes(n);
  }, [searchParams]);

  // Only show previous teachers who match the selected role (teacher/TA/both)
  const eligiblePreviousTeachers = useMemo(() => {
    if (!roleNeeded) return previousTeachers;
    if (roleNeeded === "teacher") {
      return previousTeachers.filter((t) => t.roleType === "teacher" || t.roleType === "both");
    }
    if (roleNeeded === "ta") {
      return previousTeachers.filter((t) => t.roleType === "ta" || t.roleType === "both");
    }
    return previousTeachers;
  }, [previousTeachers, roleNeeded]);

  // Clear preferred teacher if they're no longer in the filtered list (e.g. role changed)
  useEffect(() => {
    if (preferredTeacherId && !eligiblePreviousTeachers.some((t) => t.id === preferredTeacherId)) {
      setPreferredTeacherId("");
    }
  }, [eligiblePreviousTeachers, preferredTeacherId]);

  // Fetch availability for previous teachers when date changes so we can grey out unavailable
  useEffect(() => {
    if (!date || eligiblePreviousTeachers.length === 0) {
      setUnavailableOnDate(new Set());
      return;
    }
    setCheckingAvailability(true);
    const dateStr = format(date, "yyyy-MM-dd");
    Promise.all(
      eligiblePreviousTeachers.map((t) =>
        fetch(`/api/teacher/availability/check?teacherId=${encodeURIComponent(t.id)}&date=${dateStr}`, {
          credentials: "include",
        })
          .then((r) => r.json())
          .then((data) => (data.available === false ? t.id : null))
          .catch(() => null)
      )
    ).then((results) => {
      setUnavailableOnDate(new Set(results.filter((id): id is string => id != null)));
      setCheckingAvailability(false);
    });
  }, [date, eligiblePreviousTeachers]);

  const timeValid = startTime < endTime;
  const canSubmit = Boolean(date && roleNeeded && timeValid);
  const selectedTeacher = eligiblePreviousTeachers.find((t) => t.id === preferredTeacherId) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !roleNeeded) {
      setShowRequiredHint(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolId,
          date: format(date, "yyyy-MM-dd"),
          roleNeeded,
          subject: null,
          keyStage: keyStage || null,
          startTime,
          endTime,
          notes: notes || null,
          preferredTeacherId: preferredTeacherId || null,
          isEmergency,
        }),
      });

      if (res.ok) {
        toast.success("Cover request submitted");
        router.push("/school/requests");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Failed to submit cover request. Please try again.");
      }
    } catch {
      toast.error("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Template Selector */}
        <Card className="qs-pop">
          <CardContent className="px-4 py-3">
            <TemplateSelector
              onSelect={(t) => {
                setRoleNeeded(t.roleNeeded);
                if (t.keyStage) setKeyStage(t.keyStage);
                setStartTime(t.startTime);
                setEndTime(t.endTime);
                if (t.notes) setNotes(t.notes);
                toast.success(`Loaded template "${t.name}"`);
              }}
              currentValues={{
                roleNeeded,
                keyStage,
                startTime,
                endTime,
                notes,
              }}
            />
          </CardContent>
        </Card>

        <Card className="qs-pop border-primary/20 bg-primary/[0.03]">
          <CardContent className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Step 1</span>
            <span className={date ? "font-medium" : "text-muted-foreground"}>Date</span>
            <span className="text-muted-foreground">•</span>
            <span className={roleNeeded ? "font-medium" : "text-muted-foreground"}>Role</span>
            <span className="text-muted-foreground">•</span>
            <span className={keyStage ? "font-medium" : "text-muted-foreground"}>Year Group</span>
            <span className="text-muted-foreground">•</span>
            <span className={selectedTeacher ? "font-medium" : "text-muted-foreground"}>Previous Teacher (Optional)</span>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card className="qs-pop">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Date</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                // Default emergency to true for same-day, false for future
                if (d) setIsEmergency(isToday(d));
              }}
              disabled={(d) => isBefore(d, startOfDay(new Date())) || d.getDay() === 0 || d.getDay() === 6}
              className="rounded-md border"
            />
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="emergency"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <label
                htmlFor="emergency"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Emergency request (shorter response window)
              </label>
            </div>
            {isEmergency && (
              <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Same-day or urgent — shorter response window applies
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role & Subject */}
        <Card className="qs-pop">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Role Needed</Label>
              <Select value={roleNeeded} onValueChange={setRoleNeeded}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="ta">Teaching Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year Group</Label>
              <Select value={keyStage} onValueChange={setKeyStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year group..." />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_GROUPS.map((yg) => (
                    <SelectItem key={yg} value={yg}>{yg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">EYFS and Years 1–6 (primary)</p>
            </div>
          </CardContent>
        </Card>

        {/* Times */}
        <Card className="qs-pop">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. Times</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            {!timeValid && startTime && endTime && (
              <p className="mt-2 text-xs text-destructive">End time must be after start time.</p>
            )}
          </CardContent>
        </Card>

        {/* Previous Teachers — always shown so the option is visible in the demo; empty state when none yet */}
        <Card className="qs-pop">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">4. Request Previous Teacher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Optionally select a teacher who has previously worked at your school (only those who match the role above are shown). The agency can try to offer them first.
            </p>
            {checkingAvailability && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Checking availability...
              </div>
            )}
            {eligiblePreviousTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 rounded-lg border border-dashed bg-muted/30 text-center">
                {previousTeachers.length === 0
                  ? "No previous teachers yet. When you've had cover arranged through QuickSupply, those teachers will appear here so you can request them again."
                  : "No previous teachers match the selected role. Choose a different role above or leave this blank."}
              </p>
            ) : (
              <div className="grid gap-2">
                {preferredTeacherId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setPreferredTeacherId("")}
                  >
                    Clear selection
                  </Button>
                )}
                {eligiblePreviousTeachers.map((t) => {
                  const unavailable = unavailableOnDate.has(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={unavailable}
                      aria-label={`Request ${t.firstName} ${t.lastName}${unavailable ? " (unavailable)" : ""}`}
                      onClick={() => !unavailable && setPreferredTeacherId(t.id === preferredTeacherId ? "" : t.id)}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                        unavailable
                          ? "cursor-not-allowed border-muted bg-muted/30 opacity-75"
                          : t.id === preferredTeacherId
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">
                          {t.firstName} {t.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">{t.roleType}</div>
                        {unavailable && (
                          <div className="mt-1 text-xs text-amber-600">Unavailable on this date</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="qs-pop">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">5. Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Any special requirements or information..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="sticky bottom-2 z-10 rounded-xl border bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm">
              <p className="font-medium">
                {date ? format(date, "EEE d MMM yyyy") : "Choose a date"} • {roleNeeded ? roleNeeded.toUpperCase() : "Choose role"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedTeacher
                  ? `Preferred teacher: ${selectedTeacher.firstName} ${selectedTeacher.lastName}`
                  : "Preferred teacher not selected"}
              </p>
            </div>
            <Button type="submit" disabled={loading || !canSubmit} className="w-full sm:w-auto" size="lg">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Cover Request"
              )}
            </Button>
          </div>
          {showRequiredHint && !canSubmit && (
            <p className="mt-2 text-xs text-destructive">Please select both a date and role before submitting.</p>
          )}
        </div>
      </div>
    </form>
  );
}
