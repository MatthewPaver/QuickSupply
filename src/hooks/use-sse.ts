"use client";

import { useEffect, useRef, useState } from "react";
import type { SSEEvent } from "@/types";

/**
 * Subscribes to the SSE stream at the given URL and invokes onEvent for each event.
 * Reconnects on close/error with backoff. Used for live dashboard and teacher jobs updates.
 */
export function useSSE(url: string | null, onEvent: (event: SSEEvent) => void) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!url || typeof window === "undefined") return;
    const baseUrl: string = url;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const maxBackoff = 30000;

    function connect() {
      eventSource = new EventSource(baseUrl);

      eventSource.onopen = () => {
        setConnected(true);
        attempt = 0; // Reset backoff only after a successful connection
      };

      eventSource.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as SSEEvent;
          onEventRef.current(event);
        } catch {
          // ignore parse errors (e.g. heartbeat)
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;
        setConnected(false);
        const delay = Math.min(1000 * 2 ** attempt, maxBackoff);
        attempt += 1;
        reconnectTimeout = setTimeout(connect, delay);
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
      setConnected(false);
    };
  }, [url]);

  return { connected };
}
