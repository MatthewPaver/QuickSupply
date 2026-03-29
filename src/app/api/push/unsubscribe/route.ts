import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const unsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

/** POST: Remove a push subscription for the current user. */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  db.delete(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, session.userId),
        eq(pushSubscriptions.userRole, session.role),
        eq(pushSubscriptions.endpoint, parsed.data.endpoint)
      )
    )
    .run();

  return NextResponse.json({ success: true });
}
