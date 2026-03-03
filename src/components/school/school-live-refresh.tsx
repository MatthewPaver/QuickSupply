"use client";

import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";

/** Subscribes to school SSE and refreshes the page when events arrive. */
export function SchoolLiveRefresh({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  useSSE(schoolId ? `/api/sse/school/${schoolId}` : null, (event) => {
    if (event.type === "notification") {
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("qs-notification"));
    }
    router.refresh();
  });
  return null;
}
