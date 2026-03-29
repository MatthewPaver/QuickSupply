"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Preference {
  category: string;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  offers: "Offers",
  booking_confirmations: "Booking Confirmations",
  cancellations: "Cancellations",
  reminders: "Reminders",
  timesheets: "Timesheets",
};

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/notification-preferences");
        if (!res.ok) throw new Error("Failed to load preferences");
        const data: Preference[] = await res.json();
        setPrefs(data);
      } catch {
        toast.error("Failed to load notification preferences");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updatePref = useCallback(
    async (category: string, field: "pushEnabled" | "inAppEnabled", value: boolean) => {
      const key = `${category}-${field}`;
      setUpdating(key);

      // Optimistic update
      setPrefs((prev) =>
        prev.map((p) => (p.category === category ? { ...p, [field]: value } : p))
      );

      try {
        const current = prefs.find((p) => p.category === category);
        if (!current) return;

        const res = await fetch("/api/notification-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category,
            pushEnabled: field === "pushEnabled" ? value : current.pushEnabled,
            inAppEnabled: field === "inAppEnabled" ? value : current.inAppEnabled,
          }),
        });

        if (!res.ok) throw new Error("Failed to update");
        toast.success("Preference updated");
      } catch {
        // Revert on failure
        setPrefs((prev) =>
          prev.map((p) => (p.category === category ? { ...p, [field]: !value } : p))
        );
        toast.error("Failed to update preference");
      } finally {
        setUpdating(null);
      }
    },
    [prefs]
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you receive via push and in-app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-6 gap-y-1 text-sm">
            <div className="font-medium text-muted-foreground">Category</div>
            <div className="font-medium text-muted-foreground text-center">Push</div>
            <div className="font-medium text-muted-foreground text-center">In-App</div>

            {prefs.map((pref) => (
              <div
                key={pref.category}
                className="col-span-3 grid grid-cols-subgrid items-center border-t py-3"
              >
                <Label className="font-normal">
                  {CATEGORY_LABELS[pref.category] ?? pref.category}
                </Label>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.pushEnabled}
                    disabled={updating === `${pref.category}-pushEnabled`}
                    onCheckedChange={(val) => updatePref(pref.category, "pushEnabled", val)}
                    aria-label={`Push notifications for ${CATEGORY_LABELS[pref.category]}`}
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    checked={pref.inAppEnabled}
                    disabled={updating === `${pref.category}-inAppEnabled`}
                    onCheckedChange={(val) => updatePref(pref.category, "inAppEnabled", val)}
                    aria-label={`In-app notifications for ${CATEGORY_LABELS[pref.category]}`}
                  />
                </div>
              </div>
            ))}
          </div>

          {prefs.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <BellOff className="size-4" />
              <span>No notification categories available.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
