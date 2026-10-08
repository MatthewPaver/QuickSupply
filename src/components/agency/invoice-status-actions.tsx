"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, CheckCircle } from "lucide-react";

interface InvoiceStatusActionsProps {
  invoiceId: string;
  currentStatus: string;
}

export function InvoiceStatusActions({
  invoiceId,
  currentStatus,
}: InvoiceStatusActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nextStatus = currentStatus === "draft" ? "sent" : "paid";
  const actionLabel =
    currentStatus === "draft" ? "Mark as Sent" : "Mark as Paid";
  const ActionIcon = currentStatus === "draft" ? Send : CheckCircle;

  async function handleStatusChange() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/agency/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update invoice status");
        return;
      }

      toast.success(
        `Invoice marked as ${nextStatus === "sent" ? "sent" : "paid"}`
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <ActionIcon className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription>
            {currentStatus === "draft"
              ? "Mark this invoice as sent to the school? You can still mark it as paid later."
              : "Mark this invoice as paid? This action indicates full payment has been received."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleStatusChange} disabled={submitting}>
            {submitting ? "Updating..." : actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
