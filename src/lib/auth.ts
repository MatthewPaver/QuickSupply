import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session, UserRole } from "@/types";

const SESSION_COOKIE = "qs_session";

/** Secret for signing session cookies; must be set in production. */
function getSessionSecret(): string | null {
  const secret = process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "development") return "dev-unsafe-secret-change-in-production";
  return null;
}

function sign(payload: string): string {
  const secret = getSessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is required when NODE_ENV is not development");
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  return hmac.digest("hex");
}

/** Verifies the signature and returns the payload; returns null if invalid or secret missing. */
function verifySignedCookie(value: string): string | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const idx = value.lastIndexOf(".");
  if (idx === -1) return null;
  const payload = value.slice(0, idx);
  const sig = value.slice(idx + 1);
  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const expected = hmac.digest("hex");
  if (expected.length !== sig.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"))) return null;
  } catch {
    return null;
  }
  return payload;
}

export async function createSession(userId: string, role: UserRole, name: string) {
  const session: Session = { userId, role, name };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64");
  const signature = sign(payload);
  const value = `${payload}.${signature}`;
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: "lax",
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE);
  if (!cookie) return null;
  try {
    const payload = verifySignedCookie(cookie.value);
    if (!payload) return null;
    const decoded = Buffer.from(payload, "base64").toString("utf-8");
    const session = JSON.parse(decoded) as Session;
    // Basic shape check so we don't trust arbitrary payloads
    if (typeof session?.userId !== "string" || typeof session?.role !== "string" || typeof session?.name !== "string")
      return null;
    const roles: UserRole[] = ["school", "teacher", "agent"];
    if (!roles.includes(session.role)) return null;
    return session;
  } catch {
    return null;
  }
}

export async function requireSession(expectedRole?: UserRole): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/");
  if (expectedRole && session.role !== expectedRole) redirect("/");
  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
