"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { Check, X, Loader2, Clock, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { useSSE } from "@/hooks/use-sse";
import type { SSEEvent } from "@/types";

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
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<Record<string, string>>({});
  const [teacherId, setTeacherId] = useState<string | null>(null);

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
    if (OFFER_EVENTS.includes(event.type)) {
      loadOffers();
      router.refresh();
      if (event.type === "new_offer" && typeof document !== "undefined" && document.hidden) {
        if (Notification.permission === "granted") {
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
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newCountdown: Record<string, string> = {};
      offers
        .filter((o) => o.status === "pending")
        .forEach((o) => {
          const diff = new Date(o.expiresAt).getTime() - now;
          if (diff <= 0) {
            newCountdown[o.offerId] = "Expired";
          } else {
            const mins = Math.floor(diff / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            newCountdown[o.offerId] = `${mins}:${secs.toString().padStart(2, "0")}`;
          }
        });
      setCountdown(newCountdown);
    }, 1000);
    return () => clearInterval(interval);
  }, [offers]);

  async function handleResponse(offerId: string, response: "accepted" | "declined") {
    setActionLoading(offerId);
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
        router.refresh();
      } else {
        toast.error(data.message);
      }
    } finally {
      setActionLoading(null);
    }
  }

  const pendingOffers = offers.filter((o) => o.status === "pending");
  const pastOffers = offers.filter((o) => o.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Job Offers</h1>
        <p className="text-muted-foreground">
          {pendingOffers.length} active {pendingOffers.length === 1 ? "offer" : "offers"}
        </p>
      </div>

      {!loading && pendingOffers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No active offers right now. If the agency has just sent you an offer, refresh the page.
        </p>
      )}

      {/* Active Offers */}
      {pendingOffers.length > 0 && (
        <div className="space-y-4">
          {pendingOffers.map((offer) => (
            <Card key={offer.offerId} className="border-2 border-primary">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{offer.schoolName}</h3>
                      <div className="text-muted-foreground">
                        {new Date(offer.date).toLocaleDateString("en-GB", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })}
                      </div>
                    </div>
                    {offer.isEmergency && (
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" /> URGENT
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Role: </span>
                      <span className="capitalize font-medium">{offer.roleNeeded}</span>
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
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700">
                      Time remaining: {countdown[offer.offerId] || "..."}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      className="flex-1 min-h-11"
                      size="lg"
                      onClick={() => handleResponse(offer.offerId, "accepted")}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === offer.offerId ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-5 w-5" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      size="lg"
                      onClick={() => handleResponse(offer.offerId, "declined")}
                      disabled={actionLoading !== null}
                    >
                      <X className="mr-2 h-5 w-5" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
              description="When you accept or decline offers, they will appear here."
            />
          ) : (
            <div className="space-y-2">
              {pastOffers.map((offer) => (
                <div key={offer.offerId} className="flex items-center justify-between rounded border p-3">
                  <div>
                    <div className="text-sm font-medium">{offer.schoolName}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(offer.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} &middot;{" "}
                      <span className="capitalize">{offer.roleNeeded}</span>
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
    </div>
  );
}
