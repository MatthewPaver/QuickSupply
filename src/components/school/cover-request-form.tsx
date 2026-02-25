"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { format, isToday, isBefore, startOfDay } from "date-fns";

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
    });
  }, [date, eligiblePreviousTeachers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !roleNeeded) return;

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
        router.push("/school/requests");
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date</CardTitle>
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
              <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Same-day or urgent — shorter response window applies
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role & Subject */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Details</CardTitle>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Times</CardTitle>
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
          </CardContent>
        </Card>

        {/* Previous Teachers — always shown so the option is visible in the demo; empty state when none yet */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Previous Teacher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Optionally select a teacher who has previously worked at your school (only those who match the role above are shown). The agency can try to offer them first.
            </p>
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
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Additional Notes</CardTitle>
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
        <Button type="submit" disabled={loading || !date || !roleNeeded} className="w-full" size="lg">
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
    </form>
  );
}
