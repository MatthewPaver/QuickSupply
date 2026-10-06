"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

function subscribeOnline(onChange: () => void) {
  function handleOnline() {
    onChange();
    toast.success("Back online", { duration: 2000 });
  }
  window.addEventListener("offline", onChange);
  window.addEventListener("online", handleOnline);
  return () => {
    window.removeEventListener("offline", onChange);
    window.removeEventListener("online", handleOnline);
  };
}

export function OfflineBanner() {
  // Match the server snapshot during hydration, then read browser connectivity.
  const offline = useSyncExternalStore(subscribeOnline, () => !navigator.onLine, () => false);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="relative bg-amber-50/80 border-b border-amber-200 px-4 py-2 text-center"
    >
      <div className="mx-auto flex max-w-4xl items-center justify-center gap-2 text-sm">
        <WifiOff className="size-4 text-amber-600" />
        <span className="text-amber-800">
          You are offline — some features may be unavailable
        </span>
      </div>
    </div>
  );
}
