import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { db } from "@/lib/db";
import { notificationLog, schools, teachers, agents } from "@/lib/db/schema";
import { sendNotificationEmail } from "@/lib/email";

type RecipientType = "teacher" | "school" | "agent";

/** Resolves email for a recipient (school → contactEmail, teacher/agent → email). */
function getRecipientEmail(recipientType: RecipientType, recipientId: string): string | null {
  if (recipientType === "school") {
    const row = db.select({ email: schools.contactEmail }).from(schools).where(eq(schools.id, recipientId)).get();
    return row?.email ?? null;
  }
  if (recipientType === "teacher") {
    const row = db.select({ email: teachers.email }).from(teachers).where(eq(teachers.id, recipientId)).get();
    return row?.email ?? null;
  }
  const row = db.select({ email: agents.email }).from(agents).where(eq(agents.id, recipientId)).get();
  return row?.email ?? null;
}

type NotificationType = "offer" | "accepted" | "declined" | "expired" | "cancellation" | "reminder" | "filled";

export interface CreateNotificationOptions {
  recipientType: RecipientType;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  /** If true (default), also send an email when RESEND_API_KEY is set. */
  sendEmail?: boolean;
}

/**
 * Inserts one row into notification_log and optionally sends an email.
 * Fire-and-forget for email (no await) so callers are not blocked.
 */
export function createNotification(options: CreateNotificationOptions): void {
  const {
    recipientType,
    recipientId,
    type,
    title,
    body,
    relatedEntityType,
    relatedEntityId,
    sendEmail = true,
  } = options;

  const id = ulid();
  db.insert(notificationLog)
    .values({
      id,
      recipientType,
      recipientId,
      type,
      title,
      body,
      relatedEntityType: relatedEntityType ?? null,
      relatedEntityId: relatedEntityId ?? null,
      createdAt: new Date(),
    })
    .run();

  if (sendEmail) {
    const email = getRecipientEmail(recipientType, recipientId);
    if (email) {
      sendNotificationEmail(email, title, body).catch(() => {});
    }
  }
}

/** Notify all agents (e.g. new cover request). */
export function notifyAllAgents(type: NotificationType, title: string, body: string, relatedEntityType?: string, relatedEntityId?: string): void {
  const allAgents = db.select({ id: agents.id }).from(agents).all();
  for (const agent of allAgents) {
    createNotification({
      recipientType: "agent",
      recipientId: agent.id,
      type,
      title,
      body,
      relatedEntityType,
      relatedEntityId,
    });
  }
}
