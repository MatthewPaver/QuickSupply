"use client";

import { useRouter } from "next/navigation";
import { useSSE } from "@/hooks/use-sse";

/** Subscribes to school SSE and refreshes the page when events arrive. */
export function SchoolLiveRefresh({ schoolId }: { schoolId: string }) {
  const router = useRouter();
  useSSE(schoolId ? `/api/sse/school/${schoolId}` : null, () => {
    router.refresh();
  });
  return null;
}
