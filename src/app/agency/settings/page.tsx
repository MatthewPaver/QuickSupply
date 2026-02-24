"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Loader2 } from "lucide-react";

export default function AgencySettingsPage() {
  const [morningWindow, setMorningWindow] = useState("7");
  const [nextDayWindow, setNextDayWindow] = useState("60");
  const [loading, setLoading] = useState(false);

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
      }
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
          <div className="space-y-2">
            <Label>Morning / Emergency (minutes)</Label>
            <Input
              type="number"
              value={morningWindow}
              onChange={(e) => setMorningWindow(e.target.value)}
              min={1}
              max={30}
            />
            <p className="text-xs text-muted-foreground">
              How long a teacher has to respond for same-day requests
            </p>
          </div>

          <div className="space-y-2">
            <Label>Next Day / Standard (minutes)</Label>
            <Input
              type="number"
              value={nextDayWindow}
              onChange={(e) => setNextDayWindow(e.target.value)}
              min={5}
              max={240}
            />
            <p className="text-xs text-muted-foreground">
              How long a teacher has to respond for advance requests
            </p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
