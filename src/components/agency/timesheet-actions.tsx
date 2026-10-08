"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TimesheetActionsProps {
  timesheetId: string;
  teacherName: string;
}

export function TimesheetActions({ timesheetId, teacherName }: TimesheetActionsProps) {
  const router = useRouter();
  const [approving, setApproving] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [reason, setReason] = useState("");

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/agency/timesheets/${timesheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to approve timesheet");
        return;
      }
      toast.success("Timesheet approved");
      setApproveOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setApproving(false);
    }
  }

  async function handleDispute() {
    if (!reason.trim()) {
      toast.error("Please enter a reason for the dispute");
      return;
    }
    setDisputing(true);
    try {
      const res = await fetch(`/api/agency/timesheets/${timesheetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dispute", reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to dispute timesheet");
        return;
      }
      toast.success("Timesheet disputed");
      setDisputeOpen(false);
      setReason("");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setDisputing(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogTrigger asChild>
          <Button size="sm">Approve</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Timesheet</DialogTitle>
            <DialogDescription>
              Approve this timesheet for {teacherName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)} disabled={approving}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={approving}>
              {approving ? "Approving..." : "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={disputeOpen} onOpenChange={(open) => {
        setDisputeOpen(open);
        if (!open) setReason("");
      }}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">
            Dispute
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispute Timesheet</DialogTitle>
            <DialogDescription>
              Provide a reason for disputing this timesheet for {teacherName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Enter dispute reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {reason.length}/500
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeOpen(false)} disabled={disputing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDispute}
              disabled={disputing || !reason.trim()}
            >
              {disputing ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
