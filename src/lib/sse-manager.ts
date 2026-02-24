import type { SSEEvent } from "@/types";

type SSEListener = (event: SSEEvent) => void;

class SSEManager {
  private channels: Map<string, Set<SSEListener>> = new Map();

  subscribe(channel: string, listener: SSEListener): () => void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.channels.get(channel);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.channels.delete(channel);
        }
      }
    };
  }

  emit(channel: string, event: Omit<SSEEvent, "timestamp">) {
    const fullEvent: SSEEvent = {
      ...event,
      timestamp: Date.now(),
    };
    const listeners = this.channels.get(channel);
    if (listeners) {
      listeners.forEach((listener) => listener(fullEvent));
    }
  }

  getChannelCount(): number {
    return this.channels.size;
  }
}

// Singleton instance (persists across hot reloads in dev)
const globalForSSE = globalThis as unknown as { sseManager: SSEManager };
export const sseManager = globalForSSE.sseManager ?? new SSEManager();
if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseManager = sseManager;
}
