"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  teacherId: string;
  initialCompliance: {
    dbsStatus: "clear" | "pending" | "expired" | "none";
    dbsExpiry: string | null;
    rightToWork: "verified" | "pending" | "not_checked";
    complianceStatus: "compliant" | "pending" | "expired";
    complianceNotes: string | null;
  };
}

export function TeacherComplianceForm({ teacherId, initialCompliance }: Props) {
  const router = useRouter();
  const [complianceStatus, setComplianceStatus] = useState(initialCompliance.complianceStatus);
  const [dbsStatus, setDbsStatus] = useState(initialCompliance.dbsStatus);
  const [dbsExpiry, setDbsExpiry] = useState(initialCompliance.dbsExpiry ?? "");
  const [rightToWork, setRightToWork] = useState(initialCompliance.rightToWork);
  const [complianceNotes, setComplianceNotes] = useState(initialCompliance.complianceNotes ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showDbsExpiry = dbsStatus === "clear" || dbsStatus === "expired";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setSuccessMessage("");

    const body = {
      complianceStatus,
      dbsStatus,
      dbsExpiry: showDbsExpiry && dbsExpiry ? dbsExpiry : null,
      rightToWork,
      complianceNotes: complianceNotes || null,
    };

    try {
      const res = await fetch(`/api/agency/teachers/${teacherId}/compliance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.fieldErrors) setFieldErrors(data.fieldErrors);
        else setFieldErrors({ _root: [data.error ?? "Something went wrong"] });
        return;
      }

      setSuccessMessage("Compliance updated");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Compliance</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="complianceStatus">Overall Compliance Status</Label>
            <select
              id="complianceStatus"
              value={complianceStatus}
              onChange={(e) => setComplianceStatus(e.target.value as typeof complianceStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="compliant">Compliant</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
            {fieldErrors.complianceStatus && (
              <p className="text-xs text-destructive">{fieldErrors.complianceStatus.join(", ")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="dbsStatus">DBS Status</Label>
            <select
              id="dbsStatus"
              value={dbsStatus}
              onChange={(e) => setDbsStatus(e.target.value as typeof dbsStatus)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">None</option>
              <option value="clear">Clear</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
            {fieldErrors.dbsStatus && (
              <p className="text-xs text-destructive">{fieldErrors.dbsStatus.join(", ")}</p>
            )}
          </div>

          {showDbsExpiry && (
            <div className="space-y-1">
              <Label htmlFor="dbsExpiry">DBS Expiry Date</Label>
              <input
                id="dbsExpiry"
                type="date"
                value={dbsExpiry}
                onChange={(e) => setDbsExpiry(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {fieldErrors.dbsExpiry && (
                <p className="text-xs text-destructive">{fieldErrors.dbsExpiry.join(", ")}</p>
              )}
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="rightToWork">Right to Work</Label>
            <select
              id="rightToWork"
              value={rightToWork}
              onChange={(e) => setRightToWork(e.target.value as typeof rightToWork)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="not_checked">Not Checked</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
            </select>
            {fieldErrors.rightToWork && (
              <p className="text-xs text-destructive">{fieldErrors.rightToWork.join(", ")}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="complianceNotes">Compliance Notes</Label>
            <textarea
              id="complianceNotes"
              value={complianceNotes}
              onChange={(e) => setComplianceNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Optional notes..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {fieldErrors.complianceNotes && (
              <p className="text-xs text-destructive">{fieldErrors.complianceNotes.join(", ")}</p>
            )}
          </div>

          {fieldErrors._root && (
            <p className="text-xs text-destructive">{fieldErrors._root.join(", ")}</p>
          )}

          {successMessage && (
            <p className="text-xs text-green-600">{successMessage}</p>
          )}

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "Saving..." : "Save Compliance"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
