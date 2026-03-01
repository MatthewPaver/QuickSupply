"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Car, Moon, AlertTriangle, Clock, Shield } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";

/** Role type options for teacher/TA as per script: Teacher, TA, Both */
const ROLE_TYPES = [
  { value: "teacher", label: "Teacher" },
  { value: "ta", label: "Teaching Assistant" },
  { value: "both", label: "Both" },
] as const;

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<{
    canDrive: boolean;
    maxDistanceMiles: number;
    emergencyAvailable: boolean;
    contactNightBeforeOnly: boolean;
    longTermWilling: boolean;
    roleType: string;
    complianceStatus: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const res = await fetch("/api/teacher/profile");
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setProfile(data);
      setError(false);
    } catch {
      setError(true);
      toast.error("Could not load profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        toast.success("Profile saved");
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
    } catch {
      toast.error("Failed to save profile. Check your connection.");
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

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-sm text-muted-foreground">Could not load profile.</p>
        <Button onClick={() => { setLoading(true); loadProfile(); }}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile & Preferences</h1>
        <p className="text-muted-foreground">Manage your work preferences</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <StatusBadge
              status={
                profile.complianceStatus === "compliant"
                  ? "compliant"
                  : profile.complianceStatus === "expired"
                    ? "expired-compliance"
                    : "pending-compliance"
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Managed by your agency. Contact them if this needs updating.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Role type: used by agency for ranking and offering (script requirement) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Role Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label>I work as</Label>
            <Select
              value={profile.roleType}
              onValueChange={(v) => setProfile({ ...profile, roleType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {ROLE_TYPES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              The agency uses this to match you to cover requests (Teacher, TA, or both).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transport</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleOption
              icon={<Car className="h-5 w-5" />}
              label="I can drive"
              description="You have access to a car for commuting"
              checked={profile.canDrive}
              onChange={(v) => setProfile({ ...profile, canDrive: v })}
            />
            <div className="space-y-2">
              <Label>Maximum travel distance (miles)</Label>
              <Input
                type="number"
                value={profile.maxDistanceMiles}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= 50) {
                    setProfile({ ...profile, maxDistanceMiles: val });
                  } else if (e.target.value === "") {
                    setProfile({ ...profile, maxDistanceMiles: 1 });
                  }
                }}
                min={1}
                max={50}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Availability Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ToggleOption
              icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
              label="Available for same-day emergencies"
              description="You can be contacted for urgent last-minute cover"
              checked={profile.emergencyAvailable}
              onChange={(v) => setProfile({ ...profile, emergencyAvailable: v })}
            />
            <ToggleOption
              icon={<Moon className="h-5 w-5 text-blue-500" />}
              label="Contact night before only"
              description="Only contact you the evening before, not earlier"
              checked={profile.contactNightBeforeOnly}
              onChange={(v) => setProfile({ ...profile, contactNightBeforeOnly: v })}
            />
            <ToggleOption
              icon={<Clock className="h-5 w-5 text-purple-500" />}
              label="Willing for long-term placements"
              description="Open to multi-day or ongoing assignments"
              checked={profile.longTermWilling}
              onChange={(v) => setProfile({ ...profile, longTermWilling: v })}
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg" className="w-full md:w-auto">
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save Preferences
      </Button>
    </div>
  );
}

function ToggleOption({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-colors ${
        checked
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/30"
      }`}
    >
      <div className={checked ? "text-primary" : "text-muted-foreground"}>{icon}</div>
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div
        className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <div
          className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </button>
  );
}
