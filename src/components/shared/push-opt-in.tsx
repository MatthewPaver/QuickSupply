"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const LS_KEY = "qs_push_enabled";
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export function PushOptIn() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    // Restore persisted state for quick UI render
    const stored = localStorage.getItem(LS_KEY);
    if (stored === "true") {
      setEnabled(true);
    }
  }, []);

  const handleEnable = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied. Please enable it in your browser settings.");
        setLoading(false);
        return;
      }

      if (!VAPID_PUBLIC_KEY) {
        // No VAPID key configured — enable toggle but skip actual subscription
        localStorage.setItem(LS_KEY, "true");
        setEnabled(true);
        toast.success("Push notifications enabled");
        setLoading(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });

      const subJson = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh ?? "",
            auth: subJson.keys?.auth ?? "",
          },
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save subscription");
      }

      localStorage.setItem(LS_KEY, "true");
      setEnabled(true);
      toast.success("Push notifications enabled");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to enable push notifications";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDisable = useCallback(async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
          await subscription.unsubscribe();
        }
      }

      localStorage.setItem(LS_KEY, "false");
      setEnabled(false);
      toast.success("Push notifications disabled");
    } catch {
      toast.error("Failed to disable push notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  if (!supported) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BellOff className="size-4" />
        <span>Push notifications not supported in this browser</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="push-toggle"
        checked={enabled}
        disabled={loading}
        onCheckedChange={(checked) => {
          if (checked) {
            handleEnable();
          } else {
            handleDisable();
          }
        }}
      />
      <Label htmlFor="push-toggle" className="flex items-center gap-2 cursor-pointer">
        {enabled ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        <span>Enable push notifications</span>
      </Label>
    </div>
  );
}
