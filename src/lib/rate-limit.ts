import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

interface RuleConfig {
  limit: number;
  windowMs: number;
  window: `${number} m`;
  prefix: string;
}

const RULES = {
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    window: "15 m",
    prefix: "qs:rl:login",
  },
  api: {
    limit: 20,
    windowMs: 60 * 1000,
    window: "1 m",
    prefix: "qs:rl:api",
  },
  passwordResetRequest: {
    limit: 3,
    windowMs: 15 * 60 * 1000,
    window: "15 m",
    prefix: "qs:rl:pw-reset-request",
  },
  passwordResetConfirm: {
    limit: 10,
    windowMs: 15 * 60 * 1000,
    window: "15 m",
    prefix: "qs:rl:pw-reset-confirm",
  },
} satisfies Record<string, RuleConfig>;

type RuleName = keyof typeof RULES;

interface Entry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, Entry>();

const upstashEnabled = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

const upstashRedis = upstashEnabled ? Redis.fromEnv() : null;

const upstashLimiters: Record<RuleName, Ratelimit> | null = upstashRedis
  ? {
      login: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.fixedWindow(RULES.login.limit, RULES.login.window),
        prefix: RULES.login.prefix,
      }),
      api: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.fixedWindow(RULES.api.limit, RULES.api.window),
        prefix: RULES.api.prefix,
      }),
      passwordResetRequest: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.fixedWindow(
          RULES.passwordResetRequest.limit,
          RULES.passwordResetRequest.window
        ),
        prefix: RULES.passwordResetRequest.prefix,
      }),
      passwordResetConfirm: new Ratelimit({
        redis: upstashRedis,
        limiter: Ratelimit.fixedWindow(
          RULES.passwordResetConfirm.limit,
          RULES.passwordResetConfirm.window
        ),
        prefix: RULES.passwordResetConfirm.prefix,
      }),
    }
  : null;

let upstashErrorLogged = false;

function logUpstashFallback(error: unknown) {
  if (upstashErrorLogged) return;
  upstashErrorLogged = true;
  console.error(
    "[rate-limit] Upstash unavailable, falling back to in-memory limiting.",
    error
  );
}

function getMemoryKey(rule: RuleName, identifier: string): string {
  return `${RULES[rule].prefix}:${identifier}`;
}

function isMemoryLimited(rule: RuleName, identifier: string): boolean {
  const { limit, windowMs } = RULES[rule];
  const key = getMemoryKey(rule, identifier);
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

let lastPrune = 0;
function pruneMemory(now: number) {
  if (now - lastPrune < 60_000) return;
  lastPrune = now;
  for (const [key, entry] of memoryStore.entries()) {
    if (now >= entry.resetAt) memoryStore.delete(key);
  }
}

async function isLimited(rule: RuleName, identifier: string): Promise<boolean> {
  if (!identifier) return false;

  if (upstashLimiters) {
    try {
      const result = await upstashLimiters[rule].limit(identifier);
      return !result.success;
    } catch (error) {
      logUpstashFallback(error);
    }
  }

  pruneMemory(Date.now());
  return isMemoryLimited(rule, identifier);
}

/** Returns true if the request should be rate-limited (caller should return 429). */
export async function rateLimitLogin(identifier: string): Promise<boolean> {
  return isLimited("login", identifier);
}

/** Returns true if high-value APIs should be rate-limited. */
export async function rateLimitApi(identifier: string): Promise<boolean> {
  return isLimited("api", identifier);
}

/** Returns true if forgot-password should be rate-limited (3 per 15 min per client). */
export async function rateLimitPasswordReset(identifier: string): Promise<boolean> {
  return isLimited("passwordResetRequest", identifier);
}

/** Returns true if reset-password confirmation should be rate-limited. */
export async function rateLimitPasswordResetConfirm(
  identifier: string
): Promise<boolean> {
  return isLimited("passwordResetConfirm", identifier);
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
