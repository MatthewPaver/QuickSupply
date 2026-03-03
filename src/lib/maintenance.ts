import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notificationLog, passwordResetTokens } from "@/lib/db/schema";

export function cleanupExpiredPasswordResetTokens(now = new Date()): number {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(passwordResetTokens)
    .where(lte(passwordResetTokens.expiresAt, now))
    .get();
  const count = Number(row?.count ?? 0);
  if (count > 0) {
    db.delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, now))
      .run();
  }
  return count;
}

export function cleanupOldReadNotifications(
  retentionDays: number,
  now = new Date()
): number {
  const cutoff = new Date(
    now.getTime() - retentionDays * 24 * 60 * 60 * 1000
  );
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.read, true),
        lte(notificationLog.createdAt, cutoff)
      )
    )
    .get();
  const count = Number(row?.count ?? 0);
  if (count > 0) {
    db.delete(notificationLog)
      .where(
        and(
          eq(notificationLog.read, true),
          lte(notificationLog.createdAt, cutoff)
        )
      )
      .run();
  }
  return count;
}
