import { and, eq, gte, lte, sql, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  complianceDocuments,
  teachers,
  notificationLog,
} from "@/lib/db/schema";
import { createNotification, notifyAllAgents } from "@/lib/notifications";
import { addDays, format, startOfDay } from "date-fns";

/**
 * Check if a reminder notification has already been sent today for a given
 * document (relatedEntityId) and recipient.
 */
function alreadyNotifiedToday(
  recipientType: "teacher" | "agent",
  recipientId: string,
  documentId: string,
  today: Date
): boolean {
  const startOfToday = startOfDay(today);
  const endOfToday = addDays(startOfToday, 1);

  const existing = db
    .select({ id: notificationLog.id })
    .from(notificationLog)
    .where(
      and(
        eq(notificationLog.recipientType, recipientType),
        eq(notificationLog.recipientId, recipientId),
        eq(notificationLog.type, "reminder"),
        eq(notificationLog.relatedEntityId, documentId),
        gte(notificationLog.createdAt, startOfToday),
        lt(notificationLog.createdAt, endOfToday)
      )
    )
    .get();

  return !!existing;
}

/**
 * Check for documents expiring within 30 or 7 days and send reminder
 * notifications. Only sends one notification per document per recipient per
 * day to avoid duplicates.
 *
 * Returns the number of notifications created.
 */
export function checkExpiringDocuments(now = new Date()): number {
  const today = startOfDay(now);
  const in7Days = format(addDays(today, 7), "yyyy-MM-dd");
  const in30Days = format(addDays(today, 30), "yyyy-MM-dd");
  const todayStr = format(today, "yyyy-MM-dd");

  // Find verified documents expiring within 30 days (but not already expired)
  const expiringDocs = db
    .select({
      docId: complianceDocuments.id,
      teacherId: complianceDocuments.teacherId,
      documentType: complianceDocuments.documentType,
      expiryDate: complianceDocuments.expiryDate,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(complianceDocuments)
    .innerJoin(teachers, eq(complianceDocuments.teacherId, teachers.id))
    .where(
      and(
        eq(complianceDocuments.status, "verified"),
        gte(complianceDocuments.expiryDate, todayStr),
        lte(complianceDocuments.expiryDate, in30Days)
      )
    )
    .all();

  let notificationCount = 0;

  for (const doc of expiringDocs) {
    if (!doc.expiryDate) continue;

    const teacherName = `${doc.teacherFirstName} ${doc.teacherLastName}`;
    const docLabel = doc.documentType.toUpperCase().replace("_", " ");
    const isWithin7Days = doc.expiryDate <= in7Days;

    // Always notify agency (for both 30-day and 7-day windows)
    if (!alreadyNotifiedToday("agent", "all-agents", doc.docId, now)) {
      const daysMsg = isWithin7Days ? "7 days" : "30 days";
      notifyAllAgents(
        "reminder",
        `${docLabel} expiring in ${daysMsg}`,
        `${docLabel} for ${teacherName} expires on ${doc.expiryDate}. Please ensure the teacher uploads a renewed document.`,
        "compliance_document",
        doc.docId
      );
      notificationCount++;
    }

    // Notify teacher only within 7 days
    if (isWithin7Days) {
      if (!alreadyNotifiedToday("teacher", doc.teacherId, doc.docId, now)) {
        createNotification({
          recipientType: "teacher",
          recipientId: doc.teacherId,
          type: "reminder",
          title: `${docLabel} expiring soon`,
          body: `Your ${docLabel} expires on ${doc.expiryDate}. Please upload a renewed document as soon as possible.`,
          relatedEntityType: "compliance_document",
          relatedEntityId: doc.docId,
        });
        notificationCount++;
      }
    }
  }

  return notificationCount;
}

/**
 * Expire verified documents whose expiryDate has passed. Updates their status
 * to "expired" and recalculates the teacher's complianceStatus.
 *
 * Returns the number of documents expired.
 */
export function expireDocuments(now = new Date()): number {
  const todayStr = format(startOfDay(now), "yyyy-MM-dd");

  // Find verified documents that have expired
  const expiredDocs = db
    .select({
      docId: complianceDocuments.id,
      teacherId: complianceDocuments.teacherId,
    })
    .from(complianceDocuments)
    .where(
      and(
        eq(complianceDocuments.status, "verified"),
        lt(complianceDocuments.expiryDate, todayStr)
      )
    )
    .all();

  if (expiredDocs.length === 0) return 0;

  // Mark each document as expired
  for (const doc of expiredDocs) {
    db.update(complianceDocuments)
      .set({ status: "expired" })
      .where(eq(complianceDocuments.id, doc.docId))
      .run();
  }

  // Recalculate compliance status for affected teachers
  const affectedTeacherIds = [...new Set(expiredDocs.map((d) => d.teacherId))];

  for (const teacherId of affectedTeacherIds) {
    recalculateComplianceStatus(teacherId);
  }

  return expiredDocs.length;
}

/**
 * Recalculate a teacher's complianceStatus based on their required documents
 * (DBS and right_to_work). If any required document is expired (or missing a
 * verified copy), the teacher is marked "expired".
 *
 * This is the SINGLE source of truth for compliance calculation.
 * Used by both the cron expiry job and the verification API route.
 */
export function recalculateComplianceStatus(teacherId: string): void {
  const requiredTypes = ["dbs", "right_to_work"] as const;

  // Get all non-archived documents for this teacher
  const docs = db
    .select({
      documentType: complianceDocuments.documentType,
      status: complianceDocuments.status,
    })
    .from(complianceDocuments)
    .where(
      and(
        eq(complianceDocuments.teacherId, teacherId),
        sql`${complianceDocuments.archivedAt} IS NULL`
      )
    )
    .all();

  let hasExpired = false;
  let allVerified = true;

  for (const reqType of requiredTypes) {
    const matching = docs.filter((d) => d.documentType === reqType);

    if (matching.length === 0) {
      // No document of this type at all
      allVerified = false;
      continue;
    }

    const hasVerified = matching.some((d) => d.status === "verified");
    const anyExpired = matching.some((d) => d.status === "expired");

    if (anyExpired && !hasVerified) {
      hasExpired = true;
    }
    if (!hasVerified) {
      allVerified = false;
    }
  }

  let newStatus: "compliant" | "pending" | "expired";
  if (hasExpired) {
    newStatus = "expired";
  } else if (allVerified) {
    newStatus = "compliant";
  } else {
    newStatus = "pending";
  }

  db.update(teachers)
    .set({ complianceStatus: newStatus })
    .where(eq(teachers.id, teacherId))
    .run();
}
