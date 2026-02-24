"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeacherAvailabilityPage() {
  const [recurringDays, setRecurringDays] = useState<boolean[]>([false, true, true, true, true, true, false]);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAvailability();
  }, []);

  async function loadAvailability() {
    try {
      const res = await fetch("/api/teacher/availability");
      const data = await res.json();
      if (data.recurring) {
        const days = [false, false, false, false, false, false, false];
        data.recurring.forEach((r: { dayOfWeek: number; isAvailable: boolean }) => {
          days[r.dayOfWeek] = r.isAvailable;
        });
        setRecurringDays(days);
      }
      if (data.specific) {
        setUnavailableDates(
          data.specific
            .filter((s: { isAvailable: boolean }) => !s.isAvailable)
            .map((s: { date: string }) => new Date(s.date))
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function toggleRecurring(dayIdx: number) {
    const updated = [...recurringDays];
    updated[dayIdx] = !updated[dayIdx];
    setRecurringDays(updated);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recurring: recurringDays.map((avail, idx) => ({ dayOfWeek: idx, isAvailable: avail })),
          unavailableDates: unavailableDates.map((d) => d.toISOString().split("T")[0]),
        }),
      });
      if (res.ok) {
        toast.success("Availability saved");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Availability</h1>
        <p className="text-muted-foreground">Set your recurring weekly pattern and mark specific dates off</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recurring Pattern */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Select the days you are generally available to work
            </p>
            <div className="flex gap-2">
              {DAY_NAMES.map((day, idx) => (
                <button
                  key={day}
                  onClick={() => toggleRecurring(idx)}
                  className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 text-sm font-medium transition-colors ${
                    recurringDays[idx]
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Current: {recurringDays.map((a, i) => a ? DAY_NAMES[i] : null).filter(Boolean).join(", ") || "None"}
            </p>
          </CardContent>
        </Card>

        {/* Specific Date Overrides */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Date Overrides</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Click dates to mark as unavailable (shown in red)
            </p>
            <Calendar
              mode="multiple"
              selected={unavailableDates}
              onSelect={(dates) => setUnavailableDates(dates || [])}
              className="rounded-md border"
              modifiers={{
                unavailable: unavailableDates,
              }}
              modifiersClassNames={{
                unavailable: "bg-red-100 text-red-700",
              }}
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full md:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Availability
      </Button>
    </div>
  );
}
