"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

export function OfflineBanner() {
  const [offline, setOffline] = useState(() =>
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );

  useEffect(() => {
    function handleOffline() {
      setOffline(true);
    }

    function handleOnline() {
      setOffline(false);
      toast.success("Back online", { duration: 2000 });
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[60] bg-amber-50/80 border-b border-amber-200 px-4 py-2 text-center"
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
