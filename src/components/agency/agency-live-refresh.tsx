"use client";

import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";

/** Subscribes to agency SSE and refreshes the page when events arrive so data stays live. */
export function AgencyLiveRefresh() {
  const router = useRouter();
  useSSE("/api/sse/agency", (event) => {
    if (event.type === "notification") {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("qs-notification"));
    }
    router.refresh();
  });
  return null;
}
