"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Props {
  schoolId: string;
  currentEmail: string;
}

export function SchoolCredentialsForm({ schoolId, currentEmail }: Props) {
  const router = useRouter();
  const [contactEmail, setContactEmail] = useState(currentEmail);
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});

    if (temporaryPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: ["Passwords do not match"] });
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/agency/schools/${schoolId}/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactEmail, temporaryPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        else setFieldErrors({ _root: [data.error ?? "Something went wrong"] });
        return;
      }

      toast.success("Credentials updated — school contact can now sign in");
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
          Set the email and a temporary password the school contact will use to sign in.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="schoolContactEmail">Contact Email</Label>
            <Input
              id="schoolContactEmail"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              required
            />
            {fieldErrors.contactEmail && (
              <p className="text-xs text-destructive">{fieldErrors.contactEmail.join(", ")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="schoolTemporaryPassword">Temporary Password</Label>
            <Input
              id="schoolTemporaryPassword"
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
            <Label htmlFor="schoolConfirmPassword">Confirm Password</Label>
            <Input
              id="schoolConfirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
            />
            {fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">{fieldErrors.confirmPassword.join(", ")}</p>
            )}
          </div>

          {fieldErrors._root && (
            <p className="text-xs text-destructive">{fieldErrors._root.join(", ")}</p>
          )}

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Saving..." : "Update Credentials"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
