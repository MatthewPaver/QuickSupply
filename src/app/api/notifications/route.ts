import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationLog } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/** GET: list notifications for current user (recipientType + recipientId from session). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipientType =
    session.role === "school" ? "school" : session.role === "teacher" ? "teacher" : "agent";
  const list = db
    .select()
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.recipientType, recipientType),
        eq(notificationLog.recipientId, session.userId)
      )
    )
    .orderBy(desc(notificationLog.createdAt))
    .limit(50)
    .all();

  return NextResponse.json(list);
}
