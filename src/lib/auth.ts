import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Session, UserRole } from "@/types";

const SESSION_COOKIE = "qs_session";

export async function createSession(userId: string, role: UserRole, name: string) {
  const session: Session = { userId, role, name };
  const encoded = Buffer.from(JSON.stringify(session)).toString("base64");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encoded, {
    httpOnly: true,
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
    const decoded = Buffer.from(cookie.value, "base64").toString("utf-8");
    return JSON.parse(decoded) as Session;
  } catch {
    return null;
  }
}

export async function requireSession(expectedRole?: UserRole): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (expectedRole && session.role !== expectedRole) redirect("/login");
  return session;
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
