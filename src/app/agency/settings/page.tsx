"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Loader2, PoundSterling, ChevronRight, SlidersHorizontal } from "lucide-react";

export default function AgencySettingsPage() {
  const [morningWindow, setMorningWindow] = useState("7");
  const [nextDayWindow, setNextDayWindow] = useState("60");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Load current settings from server
  useEffect(() => {
    fetch("/api/settings", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          if (data.morning_response_window_minutes) setMorningWindow(data.morning_response_window_minutes);
          if (data.next_day_response_window_minutes) setNextDayWindow(data.next_day_response_window_minutes);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          morning_response_window_minutes: morningWindow,
          next_day_response_window_minutes: nextDayWindow,
        }),
      });
      if (res.ok) {
        toast.success("Settings saved");
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || "Failed to save settings.");
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure system parameters</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            Response Windows
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fetching ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Morning / Emergency (minutes)</Label>
                <Input
                  type="number"
                  value={morningWindow}
                  onChange={(e) => setMorningWindow(e.target.value)}
                  min={1}
                  max={120}
                />
                <p className="text-xs text-muted-foreground">
                  How long a teacher has to respond for same-day requests (1-120 min)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Next Day / Standard (minutes)</Label>
                <Input
                  type="number"
                  value={nextDayWindow}
                  onChange={(e) => setNextDayWindow(e.target.value)}
                  min={15}
                  max={1440}
                />
                <p className="text-xs text-muted-foreground">
                  How long a teacher has to respond for advance requests (15-1440 min)
                </p>
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PoundSterling className="h-4 w-4" />
            Pay Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Manage pay and charge rates for teachers and teaching assistants.
          </p>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/agency/settings/pay-rates">
              Manage Pay Rates
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Ranking Weights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Configure how teachers are scored and ranked when matching to cover requests.
          </p>
          <Button asChild variant="outline" className="w-full justify-between">
            <Link href="/agency/settings/ranking">
              Configure Ranking Weights
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
