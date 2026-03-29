import { NextResponse } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

/** POST: Save a push subscription for the current user. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid subscription data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { endpoint, keys } = parsed.data;

  // Upsert: delete existing subscription for same user+endpoint, then insert
  db.delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, session.userId),
        eq(pushSubscriptions.userRole, session.role),
        eq(pushSubscriptions.endpoint, endpoint)
      )
    )
    .run();

  db.insert(pushSubscriptions)
    .values({
      id: ulid(),
      userId: session.userId,
      userRole: session.role,
      endpoint,
      p256dhKey: keys.p256dh,
      authKey: keys.auth,
      createdAt: new Date(),
    })
    .run();

  return NextResponse.json({ success: true });
}
