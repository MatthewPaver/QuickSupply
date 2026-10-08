"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SchoolPhase = "primary" | "secondary" | "all-through" | "nursery" | "special";

type SchoolFormValues = {
  name: string;
  address: string;
  postcode: string;
  phase: SchoolPhase;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  temporaryPassword?: string;
};

interface Props {
  mode: "create" | "edit";
  initialData?: Partial<SchoolFormValues>;
  schoolId?: string; // required when mode === "edit"
}

type FieldErrors = Record<string, string[]>;

const DEFAULTS: SchoolFormValues = {
  name: "",
  address: "",
  postcode: "",
  phase: "primary",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  temporaryPassword: "",
};

export function SchoolForm({ mode, initialData, schoolId }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<SchoolFormValues>({
    ...DEFAULTS,
    ...initialData,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);

  function setField<K extends keyof SchoolFormValues>(key: K, value: SchoolFormValues[K]) {
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
      name: values.name,
      address: values.address,
      postcode: values.postcode,
      phase: values.phase,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone,
    };

    if (mode === "create") {
      body.temporaryPassword = values.temporaryPassword;
    }

    const url =
      mode === "create"
        ? "/api/agency/schools"
        : `/api/agency/schools/${schoolId}`;
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

      if (mode === "create") {
        toast.success("School created");
        router.push("/agency/schools");
      } else {
        toast.success("School updated");
        router.push(`/agency/schools/${schoolId}`);
      }
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {/* School Details card */}
      <Card>
        <CardHeader>
          <CardTitle>School Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">School Name *</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => setField("name", e.target.value)}
              aria-invalid={!!fieldError("name")}
            />
            {fieldError("name") && (
              <p className="text-xs text-destructive">{fieldError("name")}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(e) => setField("address", e.target.value)}
              aria-invalid={!!fieldError("address")}
            />
            {fieldError("address") && (
              <p className="text-xs text-destructive">{fieldError("address")}</p>
            )}
          </div>

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
                UK postcode, used to work out travel distance
              </p>
              {fieldError("postcode") && (
                <p className="text-xs text-destructive">{fieldError("postcode")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phase">School Phase *</Label>
              <Select
                value={values.phase}
                onValueChange={(v) => setField("phase", v as SchoolPhase)}
              >
                <SelectTrigger id="phase" aria-invalid={!!fieldError("phase")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="all-through">All-Through</SelectItem>
                  <SelectItem value="nursery">Nursery</SelectItem>
                  <SelectItem value="special">Special</SelectItem>
                </SelectContent>
              </Select>
              {fieldError("phase") && (
                <p className="text-xs text-destructive">{fieldError("phase")}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information card */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="contactName">Contact Name *</Label>
            <Input
              id="contactName"
              value={values.contactName}
              onChange={(e) => setField("contactName", e.target.value)}
              aria-invalid={!!fieldError("contactName")}
            />
            {fieldError("contactName") && (
              <p className="text-xs text-destructive">{fieldError("contactName")}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={values.contactEmail}
                onChange={(e) => setField("contactEmail", e.target.value)}
                aria-invalid={!!fieldError("contactEmail")}
              />
              {fieldError("contactEmail") && (
                <p className="text-xs text-destructive">{fieldError("contactEmail")}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={values.contactPhone}
                onChange={(e) => setField("contactPhone", e.target.value)}
                aria-invalid={!!fieldError("contactPhone")}
              />
              {fieldError("contactPhone") && (
                <p className="text-xs text-destructive">{fieldError("contactPhone")}</p>
              )}
            </div>
          </div>

          {/* Temporary password (create only) */}
          {mode === "create" && (
            <div className="space-y-1.5">
              <Label htmlFor="temporaryPassword">Temporary Password *</Label>
              <Input
                id="temporaryPassword"
                type="password"
                value={values.temporaryPassword ?? ""}
                onChange={(e) => setField("temporaryPassword", e.target.value)}
                aria-invalid={!!fieldError("temporaryPassword")}
              />
              <p className="text-xs text-muted-foreground">
                School contact uses this to sign in
              </p>
              {fieldError("temporaryPassword") && (
                <p className="text-xs text-destructive">{fieldError("temporaryPassword")}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save School"}
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
    </form>
  );
}
