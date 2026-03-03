"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CONSENT_COOKIE = "cookie_consent";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const consent = document.cookie.includes(`${CONSENT_COOKIE}=1`);
    if (!consent) {
      const timer = window.setTimeout(() => setShow(true), 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  function accept() {
    document.cookie = `${CONSENT_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use essential cookies for authentication and session management.{" "}
          <Link href="/privacy" className="underline hover:text-primary">
            Privacy policy
          </Link>
        </p>
        <Button size="sm" onClick={accept}>
          Accept
        </Button>
      </div>
    </div>
  );
}
