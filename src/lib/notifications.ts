import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { db } from "@/lib/db";
import { notificationLog, schools, teachers, agents } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import {
  offerReceivedEmail,
  bookingConfirmedEmail,
  bookingCancelledEmail,
} from "@/lib/email-templates";

type RecipientType = "teacher" | "school" | "agent";

/** Resolves email for a recipient (school -> contactEmail, teacher/agent -> email). */
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

/** Resolves a friendly display name for a recipient. */
function getRecipientName(recipientType: RecipientType, recipientId: string): string {
  if (recipientType === "school") {
    const row = db.select({ name: schools.contactName }).from(schools).where(eq(schools.id, recipientId)).get();
    return row?.name ?? "School";
  }
  if (recipientType === "teacher") {
    const row = db
      .select({ firstName: teachers.firstName, lastName: teachers.lastName })
      .from(teachers)
      .where(eq(teachers.id, recipientId))
      .get();
    return row ? `${row.firstName} ${row.lastName}` : "Teacher";
  }
  const row = db.select({ name: agents.name }).from(agents).where(eq(agents.id, recipientId)).get();
  return row?.name ?? "Agent";
}

type NotificationType = "offer" | "accepted" | "declined" | "expired" | "cancellation" | "reminder" | "filled";

/** Notification types that trigger an email (not in-app only). */
const EMAIL_TYPES: ReadonlySet<NotificationType> = new Set(["offer", "filled", "cancellation"]);

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
  /** Extra context used to build rich email templates. */
  emailContext?: {
    schoolName?: string;
    teacherName?: string;
    date?: string;
    role?: string;
    startTime?: string;
    endTime?: string;
    reason?: string;
  };
}

/**
 * Builds a branded HTML email for the given notification type.
 * Falls back to null if not enough context is available.
 */
function buildTemplateEmail(
  type: NotificationType,
  recipientName: string,
  ctx: CreateNotificationOptions["emailContext"],
  fallbackTitle: string,
  fallbackBody: string,
): { subject: string; html: string } | null {
  if (!ctx) return null;

  switch (type) {
    case "offer":
      if (ctx.schoolName && ctx.date && ctx.role && ctx.startTime && ctx.endTime) {
        return offerReceivedEmail(recipientName, ctx.schoolName, ctx.date, ctx.role, ctx.startTime, ctx.endTime);
      }
      break;
    case "filled":
      if (ctx.schoolName && ctx.teacherName && ctx.date) {
        return bookingConfirmedEmail(ctx.schoolName, ctx.teacherName, ctx.date);
      }
      break;
    case "cancellation":
      if (ctx.date && ctx.reason) {
        return bookingCancelledEmail(recipientName, ctx.date, ctx.reason);
      }
      break;
  }

  return null;
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
    sendEmail: shouldSendEmail = true,
    emailContext,
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

  // Only send email for key notification types
  if (shouldSendEmail && EMAIL_TYPES.has(type)) {
    const email = getRecipientEmail(recipientType, recipientId);
    if (email) {
      const recipientName = getRecipientName(recipientType, recipientId);
      const template = buildTemplateEmail(type, recipientName, emailContext, title, body);

      if (template) {
        sendEmail(email, template.subject, template.html).catch(() => {});
      } else {
        // Fallback: wrap plain text in a minimal HTML email
        sendEmail(email, title, `<p>${body}</p>`).catch(() => {});
      }
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
