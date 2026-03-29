"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const SUBJECT_OPTIONS = [
  "English",
  "Mathematics",
  "Science",
  "History",
  "Geography",
  "MFL",
  "Art",
  "Music",
  "PE",
  "Computing",
  "RE",
  "PSHE",
  "DT",
  "Drama",
  "Early Years",
] as const;

type TeacherFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  postcode: string;
  roleType: "teacher" | "ta" | "both";
  canDrive: boolean;
  maxDistanceMiles: number;
  emergencyAvailable: boolean;
  contactNightBeforeOnly: boolean;
  longTermWilling: boolean;
  temporaryPassword?: string;
  subjects: string[];
};

interface Props {
  mode: "create" | "edit";
  initialData?: Partial<TeacherFormValues>;
  teacherId?: string;
  initialSubjects?: string[];
}

type FieldErrors = Record<string, string[]>;

const DEFAULTS: TeacherFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  postcode: "",
  roleType: "teacher",
  canDrive: false,
  maxDistanceMiles: 10,
  emergencyAvailable: false,
  contactNightBeforeOnly: false,
  longTermWilling: false,
  temporaryPassword: "",
  subjects: [],
};

export function TeacherForm({ mode, initialData, teacherId, initialSubjects }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<TeacherFormValues>({
    ...DEFAULTS,
    ...initialData,
    subjects: initialSubjects ?? initialData?.subjects ?? [],
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof TeacherFormValues>(key: K, value: TeacherFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function fieldError(key: string): string | undefined {
    return fieldErrors[key]?.[0];
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});

    const body: Record<string, unknown> = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      postcode: values.postcode,
      roleType: values.roleType,
      canDrive: values.canDrive,
      maxDistanceMiles: values.maxDistanceMiles,
      emergencyAvailable: values.emergencyAvailable,
      contactNightBeforeOnly: values.contactNightBeforeOnly,
      longTermWilling: values.longTermWilling,
    };

    if (mode === "create") {
      body.temporaryPassword = values.temporaryPassword;
    }

    const url =
      mode === "create"
        ? "/api/agency/teachers"
        : `/api/agency/teachers/${teacherId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors as FieldErrors);
        } else {
          toast.error(data.error ?? "Something went wrong");
        }
        return;
      }

      // Save subjects separately
      const subjectTeacherId = mode === "create" ? data.id : teacherId;
      if (subjectTeacherId) {
        await fetch(`/api/agency/teachers/${subjectTeacherId}/subjects`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subjects: values.subjects }),
        });
      }

      toast.success(mode === "create" ? "Teacher created" : "Teacher updated");

      if (mode === "create") {
        router.push("/agency/teachers");
      } else {
        router.push(`/agency/teachers/${teacherId}`);
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Name row */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name *</Label>
              <Input
                id="firstName"
                value={values.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                aria-invalid={!!fieldError("firstName")}
              />
              {fieldError("firstName") && (
                <p className="text-xs text-destructive">{fieldError("firstName")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name *</Label>
              <Input
                id="lastName"
                value={values.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                aria-invalid={!!fieldError("lastName")}
              />
              {fieldError("lastName") && (
                <p className="text-xs text-destructive">{fieldError("lastName")}</p>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
                aria-invalid={!!fieldError("email")}
              />
              {fieldError("email") && (
                <p className="text-xs text-destructive">{fieldError("email")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={(e) => setField("phone", e.target.value)}
                aria-invalid={!!fieldError("phone")}
              />
              {fieldError("phone") && (
                <p className="text-xs text-destructive">{fieldError("phone")}</p>
              )}
            </div>
          </div>

          {/* Postcode + role */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                value={values.postcode}
                onChange={(e) => setField("postcode", e.target.value)}
                aria-invalid={!!fieldError("postcode")}
                placeholder="e.g. SW1A 1AA"
              />
              <p className="text-xs text-muted-foreground">
                UK postcode — used for distance calculations
              </p>
              {fieldError("postcode") && (
                <p className="text-xs text-destructive">{fieldError("postcode")}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roleType">Role type *</Label>
              <Select
                value={values.roleType}
                onValueChange={(v) =>
                  setField("roleType", v as "teacher" | "ta" | "both")
                }
              >
                <SelectTrigger id="roleType" aria-invalid={!!fieldError("roleType")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="ta">TA</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
              {fieldError("roleType") && (
                <p className="text-xs text-destructive">{fieldError("roleType")}</p>
              )}
            </div>
          </div>

          {/* Max distance */}
          <div className="space-y-1.5">
            <Label htmlFor="maxDistanceMiles">Max travel distance (miles)</Label>
            <Input
              id="maxDistanceMiles"
              type="number"
              min={0}
              max={100}
              value={values.maxDistanceMiles}
              onChange={(e) =>
                setField("maxDistanceMiles", Number(e.target.value))
              }
              className="w-32"
              aria-invalid={!!fieldError("maxDistanceMiles")}
            />
            {fieldError("maxDistanceMiles") && (
              <p className="text-xs text-destructive">
                {fieldError("maxDistanceMiles")}
              </p>
            )}
          </div>

          {/* Subject Specializations */}
          <div className="space-y-2">
            <Label>Subject Specializations</Label>
            <div className="flex flex-wrap gap-2">
              {SUBJECT_OPTIONS.map((subject) => {
                const isSelected = values.subjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => {
                      setValues((prev) => ({
                        ...prev,
                        subjects: isSelected
                          ? prev.subjects.filter((s) => s !== subject)
                          : [...prev.subjects, subject],
                      }));
                    }}
                    className="focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-md"
                  >
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? ""
                          : "hover:bg-primary/10"
                      }`}
                    >
                      {subject}
                    </Badge>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Click to toggle subjects this teacher can cover
            </p>
          </div>

          {/* Boolean flags */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.canDrive}
                onChange={(e) => setField("canDrive", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Can drive to schools</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.emergencyAvailable}
                onChange={(e) => setField("emergencyAvailable", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                Available for emergency same-day calls
              </span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.contactNightBeforeOnly}
                onChange={(e) =>
                  setField("contactNightBeforeOnly", e.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Contact night before only</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={values.longTermWilling}
                onChange={(e) => setField("longTermWilling", e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                Willing for long-term placements
              </span>
            </label>
          </div>

          {/* Temporary password (create only) */}
          {mode === "create" && (
            <div className="space-y-1.5">
              <Label htmlFor="temporaryPassword">Temporary password *</Label>
              <Input
                id="temporaryPassword"
                type="password"
                value={values.temporaryPassword ?? ""}
                onChange={(e) => setField("temporaryPassword", e.target.value)}
                aria-invalid={!!fieldError("temporaryPassword")}
              />
              <p className="text-xs text-muted-foreground">
                Teacher uses this to sign in
              </p>
              {fieldError("temporaryPassword") && (
                <p className="text-xs text-destructive">
                  {fieldError("temporaryPassword")}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : mode === "create" ? "Create Teacher" : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
