import { db } from "@/lib/db";
import { activityLog } from "@/lib/db/schema";
import { ulid } from "ulid";

/**
 * Record an activity in the audit trail. Fire-and-forget — errors are logged
 * but never propagated to callers so they cannot break business logic.
 */
export function logActivity(
  actorId: string,
  actorRole: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: Record<string, unknown>,
): void {
  try {
    db.insert(activityLog)
      .values({
        id: ulid(),
        actorId,
        actorRole: actorRole as "school" | "teacher" | "agent",
        action: action as typeof activityLog.$inferInsert.action,
        entityType,
        entityId,
        details: details ? JSON.stringify(details) : null,
        createdAt: new Date(),
      })
      .run();
  } catch (err) {
    console.error("[activity-log] Failed to write activity log entry:", err);
  }
}
