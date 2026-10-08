"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LS_KEY = "qs_install_dismissed";
const DISMISS_DAYS = 30;

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if previously dismissed within the expiry window
    const dismissed = localStorage.getItem(LS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const expiryMs = DISMISS_DAYS * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < expiryMs) {
        return;
      }
      // Expired — remove and allow showing again
      localStorage.removeItem(LS_KEY);
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShow(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const choice = await deferredPrompt.current.userChoice;
    if (choice.outcome === "accepted") {
      setShow(false);
    }
    deferredPrompt.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(LS_KEY, Date.now().toString());
    setShow(false);
    deferredPrompt.current = null;
  }, []);

  if (!show) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 qs-enter"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Download className="size-5 text-primary" />
          <p className="text-sm">
            Install QuickSupply as an app on this device
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleInstall}>
            Install
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} aria-label="Dismiss install prompt">
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
