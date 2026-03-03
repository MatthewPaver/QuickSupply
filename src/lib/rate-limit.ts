/**
 * In-memory rate limiter. Resets on deploy; for multi-instance production use Redis/KV.
 * Used per-route; key is typically IP or session identifier.
 */

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();

/** Window in ms; after this we reset the count for that key. */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes for login
const WINDOW_MS_API = 60 * 1000;   // 1 minute for API

function getKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

function isLimited(prefix: string, identifier: string, limit: number, windowMs: number): boolean {
  const key = getKey(prefix, identifier);
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  if (entry.count > limit) return true;
  return false;
}

// Prune old entries periodically so the map doesn't grow forever
let lastPrune = 0;
function prune(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [k, v] of store.entries()) {
    if (now >= v.resetAt) store.delete(k);
  }
}

/** Returns true if the request should be rate-limited (caller should return 429). */
export function rateLimitLogin(identifier: string): boolean {
  prune(Date.now());
  return isLimited("login", identifier, 5, WINDOW_MS);
}

/** Returns true if the request should be rate-limited for high-value API (requests/assignments/offers). */
export function rateLimitApi(identifier: string): boolean {
  prune(Date.now());
  return isLimited("api", identifier, 20, WINDOW_MS_API);
}

/** Returns true if the request should be rate-limited for password reset (3 per 15 min per IP). */
export function rateLimitPasswordReset(identifier: string): boolean {
  prune(Date.now());
  return isLimited("pw-reset", identifier, 3, WINDOW_MS);
}

/** Get client identifier for rate limiting (IP or fallback). */
export function getClientIdentifier(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "anonymous";
}
