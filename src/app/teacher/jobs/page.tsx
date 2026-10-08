"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { Check, X, Loader2, Clock, AlertTriangle, ClipboardList } from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/shared/empty-state";
import { TimesheetForm } from "@/components/teacher/timesheet-form";
import { useSSE } from "@/hooks/use-sse";
import type { SSEEvent } from "@/types";
import { roleLabel } from "@/lib/utils";

interface PendingTimesheetBooking {
  bookingId: string;
  date: string;
  schoolName: string;
  startTime: string;
  endTime: string;
}

interface Offer {
  offerId: string;
  status: string;
  expiresAt: string;
  schoolName: string;
  date: string;
  roleNeeded: string;
  subject: string | null;
  keyStage: string | null;
  startTime: string;
  endTime: string;
  isEmergency: boolean;
}

const OFFER_EVENTS = ["new_offer", "offer_expired", "offer_accepted", "offer_declined", "offer_withdrawn"];

export default function TeacherJobsPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Record<string, string>>({});
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ offerId: string; response: "accepted" | "declined" } | null>(null);
  const [pendingTimesheets, setPendingTimesheets] = useState<PendingTimesheetBooking[]>([]);
  const [pendingTimesheetsLoading, setPendingTimesheetsLoading] = useState(true);

  const loadOffers = useCallback(async () => {
    try {
      const res = await fetch("/api/teacher/offers", { credentials: "include" });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setOffers(data);
      } else {
        setOffers([]);
        if (!res.ok) {
          toast.error(data?.error ?? "Could not load job offers. Try refreshing.");
        }
      }
    } catch {
      setOffers([]);
      toast.error("Could not load job offers. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.ok ? r.json() : null)
      .then((me) => me?.role === "teacher" && me?.userId && setTeacherId(me.userId))
      .catch(() => {});
  }, []);

  useSSE(teacherId ? `/api/sse/teacher/${teacherId}` : null, (event: SSEEvent) => {
    if (event.type === "notification") {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("qs-notification"));
    }
    if (OFFER_EVENTS.includes(event.type)) {
      loadOffers();
      if (event.type === "new_offer" && typeof document !== "undefined" && document.hidden) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("QuickSupply: New job offer", {
            body: "You have a new cover request to accept or decline.",
            icon: "/desian-logo.svg",
          });
        }
      }
    }
  });

  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    async function loadPendingTimesheets() {
      try {
        const res = await fetch("/api/teacher/bookings-pending-timesheet", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setPendingTimesheets(Array.isArray(data) ? data : []);
        }
      } catch {
        // Silently fail — not critical
      } finally {
        setPendingTimesheetsLoading(false);
      }
    }
    loadPendingTimesheets();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Countdown timer — only run when there are pending offers
  useEffect(() => {
    const pendingCount = offers.filter((o) => o.status === "pending").length;
    if (pendingCount === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdown: Record<string, string> = {};
      let hasNewExpiry = false;
      offers
        .filter((o) => o.status === "pending")
        .forEach((o) => {
          const diff = new Date(o.expiresAt).getTime() - now;
          if (diff <= 0) {
            newCountdown[o.offerId] = "Expired";
            // Only trigger reload if this is a fresh expiry (wasn't expired before)
            if (countdown[o.offerId] !== "Expired") hasNewExpiry = true;
          } else {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            newCountdown[o.offerId] = `${mins}:${secs.toString().padStart(2, "0")}`;
          }
        });
      setCountdown(newCountdown);
      if (hasNewExpiry) loadOffers();
    }, 1000);
    return () => clearInterval(interval);
  }, [offers, loadOffers, countdown]);

  async function handleResponse(offerId: string, response: "accepted" | "declined") {
    setActionLoading(offerId);
    setConfirmAction(null);
    try {
      const res = await fetch("/api/offers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, response }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadOffers();
      } else {
        toast.error(data.message || "Failed to respond to offer.");
      }
    } catch {
      toast.error("Failed to respond to offer. Please try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const pendingOffers = offers.filter((o) => o.status === "pending");
  const pastOffers = offers.filter((o) => o.status !== "pending");

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">Teacher Portal</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Job Offers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {pendingOffers.length} active {pendingOffers.length === 1 ? "offer" : "offers"} awaiting your response.
        </p>
      </div>

      {loading && pendingOffers.length === 0 && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  </div>
                  <div className="h-6 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                <div className="flex gap-3">
                  <div className="h-11 flex-1 animate-pulse rounded-md bg-muted" />
                  <div className="h-11 flex-1 animate-pulse rounded-md bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && pendingOffers.length === 0 && (
        <EmptyState
          icon="inbox"
          title="No active offers"
          description="New offers show here with a reply deadline. If the agency has just told you about one, refresh the page."
        />
      )}

      {/* Active Offers */}
      {pendingOffers.length > 0 && (
        <div className="space-y-4">
          {pendingOffers.map((offer) => {
            const isExpired = countdown[offer.offerId] === "Expired";
            return (
              <Card key={offer.offerId} className="qs-pop border border-primary/30 bg-background shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{offer.schoolName}</h3>
                        <div className="mt-0.5 text-sm text-muted-foreground">
                          {format(new Date(offer.date + "T00:00:00"), "EEEE d MMMM")}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline" className={isExpired
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-secondary/30 bg-secondary/10 text-secondary"
                        }>
                          {isExpired ? "Expired" : "Pending response"}
                        </Badge>
                        {offer.isEmergency && (
                          <Badge variant="destructive">
                            <AlertTriangle className="mr-1 h-3 w-3" /> URGENT
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground">Role: </span>
                        <span className="font-medium">{roleLabel(offer.roleNeeded)}</span>
                      </div>
                      {offer.subject && (
                        <div>
                          <span className="text-muted-foreground">Subject: </span>
                          <span className="font-medium">{offer.subject}</span>
                        </div>
                      )}
                      {offer.keyStage && (
                        <div>
                          <span className="text-muted-foreground">Year group: </span>
                          <span className="font-medium">{offer.keyStage}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Time: </span>
                        <span className="font-medium">{offer.startTime} - {offer.endTime}</span>
                      </div>
                    </div>

                    {/* Countdown */}
                    <div
                      role="timer"
                      aria-live="polite"
                      aria-label={isExpired ? "Offer expired" : `Time remaining: ${countdown[offer.offerId] || "calculating"}`}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 ${
                      isExpired
                        ? "border-destructive/30 bg-destructive/10"
                        : "border-amber-200 bg-amber-50/80"
                    }`}>
                      <Clock className={`h-4 w-4 ${isExpired ? "text-destructive" : "text-amber-700"}`} />
                      <span className={`text-sm font-semibold ${isExpired ? "text-destructive" : "text-amber-800"}`}>
                        {isExpired ? "This offer has expired" : `Time remaining: ${countdown[offer.offerId] || "..."}`}
                      </span>
                    </div>

                    {/* Confirmation dialog */}
                    {confirmAction?.offerId === offer.offerId && (
                      <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-4">
                        <p className="text-sm font-medium">
                          {confirmAction.response === "accepted"
                            ? "Accept this job offer? You will be booked in for this assignment."
                            : "Decline this job offer? The agency will offer it to the next teacher."}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant={confirmAction.response === "accepted" ? "default" : "destructive"}
                            onClick={() => handleResponse(confirmAction.offerId, confirmAction.response)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === offer.offerId ? (
                              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            ) : null}
                            Confirm {confirmAction.response === "accepted" ? "Accept" : "Decline"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmAction(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(!confirmAction || confirmAction.offerId !== offer.offerId) && (
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          className="flex-1 min-h-11"
                          size="lg"
                          onClick={() => setConfirmAction({ offerId: offer.offerId, response: "accepted" })}
                          disabled={actionLoading !== null || isExpired}
                        >
                          <Check className="mr-2 h-5 w-5" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                          size="lg"
                          onClick={() => setConfirmAction({ offerId: offer.offerId, response: "declined" })}
                          disabled={actionLoading !== null || isExpired}
                        >
                          <X className="mr-2 h-5 w-5" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Past Offers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Offer History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : pastOffers.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No offer history"
              description="Offers you accept or decline will show here."
            />
          ) : (
            <div className="space-y-2">
              {pastOffers.map((offer) => (
                <div key={offer.offerId} className="flex items-center justify-between rounded-lg border bg-background p-3">
                  <div>
                    <div className="text-sm font-semibold">{offer.schoolName}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(offer.date + "T00:00:00"), "d MMM")} &middot;{" "}
                      <span>{roleLabel(offer.roleNeeded)}</span>
                      {offer.subject && <span> - {offer.subject}</span>}
                    </div>
                  </div>
                  <StatusBadge status={offer.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Timesheets */}
      {!pendingTimesheetsLoading && pendingTimesheets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4" />
              Timesheets to Submit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTimesheets.map((booking) => (
                <TimesheetForm
                  key={booking.bookingId}
                  bookingId={booking.bookingId}
                  date={format(new Date(booking.date + "T00:00:00"), "EEEE d MMMM yyyy")}
                  schoolName={booking.schoolName}
                  startTime={booking.startTime}
                  endTime={booking.endTime}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
