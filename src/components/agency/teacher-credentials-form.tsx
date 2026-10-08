"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  teacherId: string;
  currentEmail: string;
}

export function TeacherCredentialsForm({ teacherId, currentEmail }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSuccessMessage("");

    if (temporaryPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/agency/teachers/${teacherId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, temporaryPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        else setFieldErrors({ _root: [data.error ?? "Something went wrong"] });
        return;
      }

      setSuccessMessage("Login details saved. The teacher can now sign in.");
      setTemporaryPassword("");
      setConfirmPassword("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Login Credentials</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Set the email and a temporary password this teacher will use to sign in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="credentialEmail">Email</Label>
            <Input
              id="credentialEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {fieldErrors.email && (
              <p className="text-xs text-destructive">{fieldErrors.email.join(", ")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="temporaryPassword">New Temporary Password</Label>
            <Input
              id="temporaryPassword"
              type="password"
              value={temporaryPassword}
              onChange={(e) => setTemporaryPassword(e.target.value)}
              placeholder="New temporary password"
              required
              minLength={8}
            />
            {fieldErrors.temporaryPassword && (
              <p className="text-xs text-destructive">{fieldErrors.temporaryPassword.join(", ")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">{fieldErrors.confirmPassword.join(", ")}</p>
            )}
          </div>

          {fieldErrors._root && (
            <p className="text-xs text-destructive">{fieldErrors._root.join(", ")}</p>
          )}

          {successMessage && (
            <p className="text-xs text-emerald-600">{successMessage}</p>
          )}

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Saving..." : "Update Credentials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
