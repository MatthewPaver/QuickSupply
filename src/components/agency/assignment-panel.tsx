"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Play,
  UserCheck,
  Phone,
  Star,
  Car,
  MapPin,
  Shield,
  ShieldAlert,
  Loader2,
  XCircle,
  Heart,
} from "lucide-react";
import type { RankedTeacher } from "@/types";
import { CallModal } from "@/components/agency/call-modal";

/** Parse JSON from fetch response text; returns undefined on parse error. */
function parseJsonResponse<T>(text: string): T | undefined {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

interface Props {
  requestId: string;
  requestStatus: string;
  bookingId: string | null;
  hasActiveOffer: boolean;
}

export function AssignmentPanel({ requestId, requestStatus, bookingId, hasActiveOffer }: Props) {
  const router = useRouter();
  const [ranked, setRanked] = useState<RankedTeacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [callModal, setCallModal] = useState<{ name: string; phone: string } | null>(null);

  const loadRankedTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rank_teachers", requestId }),
      });
      const text = await res.text();
      const data = parseJsonResponse<RankedTeacher[]>(text);
      if (data && Array.isArray(data)) {
        setRanked(data);
      } else {
        setRanked([]);
        if (!res.ok) {
          const err = parseJsonResponse<{ error?: string }>(text);
          toast.error(err?.error ?? "Failed to load eligible teachers.");
        }
      }
    } catch {
      setRanked([]);
      toast.error("Failed to load eligible teachers.");
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    if (requestStatus === "pending" || requestStatus === "offering") {
      loadRankedTeachers();
    }
  }, [loadRankedTeachers, requestStatus]);

  // Poll for expiry
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/cron").then(() => router.refresh());
    }, 30000);
    return () => clearInterval(interval);
  }, [router]);

  async function handleStartOffering() {
    setActionLoading("offering");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_offering", requestId }),
      });
      const text = await res.text();
      const data = parseJsonResponse<{ message?: string; error?: string }>(text);
      if (data?.message) toast.success(data.message);
      if (data?.error) toast.error(data.error);
      router.refresh();
    } catch {
      toast.error("Failed to start offering.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleManualAssign(teacherId: string) {
    setActionLoading(teacherId);
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "manual_assign", requestId, teacherId }),
      });
      const text = await res.text();
      const data = parseJsonResponse<{ success?: boolean; message?: string }>(text);
      if (data?.success) {
        toast.success(data.message);
        router.refresh();
      } else if (data?.message) {
        toast.error(data.message);
      } else if (!res.ok) {
        toast.error("Failed to assign teacher.");
      }
    } catch {
      toast.error("Failed to assign teacher.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelBooking() {
    if (!bookingId) return;
    setActionLoading("cancel");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel_booking", bookingId, reason: cancelReason }),
      });
      const text = await res.text();
      const data = parseJsonResponse<{ success?: boolean; message?: string }>(text);
      if (data?.success) {
        toast.success(data.message);
        setCancelDialogOpen(false);
        router.refresh();
      } else if (data?.message) {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to cancel booking.");
    } finally {
      setActionLoading(null);
    }
  }

  // Filled state
  if (requestStatus === "filled" && bookingId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-green-800 font-medium">This request has been filled.</p>
          </div>
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setCancelDialogOpen(true)}
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Booking
          </Button>

          <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Booking</DialogTitle>
                <DialogDescription>
                  The school will NOT be notified. You should call the teacher to inform them.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                placeholder="Reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                  Keep Booking
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleCancelBooking}
                  disabled={actionLoading === "cancel"}
                >
                  {actionLoading === "cancel" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm Cancellation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // Cancelled state
  if (requestStatus === "cancelled") {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          This request has been cancelled.
        </CardContent>
      </Card>
    );
  }

  async function handleWithdrawOffer() {
    setActionLoading("withdraw");
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "withdraw_offer", requestId }),
      });
      const text = await res.text();
      const data = parseJsonResponse<{ success?: boolean; message?: string }>(text);
      if (data?.success) {
        toast.success(data.message);
        router.refresh();
      } else {
        toast.error(data?.message ?? "Failed to withdraw offer.");
      }
    } catch {
      toast.error("Failed to withdraw offer.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          {hasActiveOffer ? "Active Offer" : "Eligible Teachers"}
        </CardTitle>
        <div className="flex items-center gap-2">
          {hasActiveOffer && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleWithdrawOffer}
              disabled={actionLoading === "withdraw"}
            >
              {actionLoading === "withdraw" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Withdraw offer
            </Button>
          )}
          {!hasActiveOffer && ranked.length > 0 && requestStatus === "pending" && (
            <Button onClick={handleStartOffering} disabled={actionLoading === "offering"} size="sm">
              {actionLoading === "offering" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Start Sequential Offering
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : ranked.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            No eligible teachers found for this request.
          </p>
        ) : (
          <div className="space-y-2">
            {ranked.map((r, idx) => (
              <div
                key={r.teacher.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {r.teacher.firstName} {r.teacher.lastName}
                      </span>
                      {r.isPreferred && (
                        <Badge variant="outline" className="border-pink-300 bg-pink-50 text-pink-700 text-xs">
                          <Heart className="mr-1 h-3 w-3" /> Preferred
                        </Badge>
                      )}
                      {r.previouslyWorkedAtSchool && (
                        <Badge variant="outline" className="text-xs">Previous</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        {r.teacher.agencyRating.toFixed(1)}
                      </span>
                      {r.schoolReviewAvg && (
                        <span className="flex items-center gap-1">
                          School: {r.schoolReviewAvg.toFixed(1)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {r.distanceMiles.toFixed(1)}mi
                      </span>
                      {r.teacher.canDrive && (
                        <span className="flex items-center gap-1">
                          <Car className="h-3 w-3" /> Drives
                        </span>
                      )}
                      <span className="capitalize">{r.teacher.roleType}</span>
                      {r.teacher.complianceStatus === "compliant" ? (
                        <Shield className="h-3 w-3 text-green-500" />
                      ) : (
                        <ShieldAlert className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {r.score.toFixed(0)} pts
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCallModal({ name: `${r.teacher.firstName} ${r.teacher.lastName}`, phone: r.teacher.phone })}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualAssign(r.teacher.id)}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === r.teacher.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="mr-1 h-4 w-4" />
                        Assign
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {callModal && (
        <CallModal
          open={!!callModal}
          onOpenChange={(open) => !open && setCallModal(null)}
          teacherName={callModal.name}
          phone={callModal.phone}
        />
      )}
    </Card>
  );
}
