"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface School {
  id: string;
  name: string;
}

interface PayRateFormProps {
  schools: School[];
}

export function PayRateForm({ schools }: PayRateFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [roleType, setRoleType] = useState<string>("teacher");
  const [schoolId, setSchoolId] = useState<string>("default");
  const [payRatePounds, setPayRatePounds] = useState("");
  const [chargeRatePounds, setChargeRatePounds] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");

  function resetForm() {
    setRoleType("teacher");
    setSchoolId("default");
    setPayRatePounds("");
    setChargeRatePounds("");
    setEffectiveFrom("");
  }

  async function handleSubmit() {
    if (!payRatePounds || !chargeRatePounds || !effectiveFrom) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payRatePence = Math.round(parseFloat(payRatePounds) * 100);
    const chargeRatePence = Math.round(parseFloat(chargeRatePounds) * 100);

    if (isNaN(payRatePence) || payRatePence < 1) {
      toast.error("Pay rate must be a valid positive amount");
      return;
    }
    if (isNaN(chargeRatePence) || chargeRatePence < 1) {
      toast.error("Charge rate must be a valid positive amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/agency/pay-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleType,
          schoolId: schoolId === "default" ? null : schoolId,
          payRate: payRatePence,
          chargeRate: chargeRatePence,
          effectiveFrom,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create pay rate");
        return;
      }

      toast.success("Pay rate created");
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Rate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Pay Rate</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Role Type</Label>
            <Select value={roleType} onValueChange={setRoleType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="ta">Teaching Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>School (optional)</Label>
            <Select value={schoolId} onValueChange={setSchoolId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (all schools)</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pay Rate (per hour)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  &pound;
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={payRatePounds}
                  onChange={(e) => setPayRatePounds(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Charge Rate (per hour)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  &pound;
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={chargeRatePounds}
                  onChange={(e) => setChargeRatePounds(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Effective From</Label>
            <Input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Creating..." : "Create Rate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
