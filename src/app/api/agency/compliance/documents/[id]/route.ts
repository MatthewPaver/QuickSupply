import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { complianceDocuments, teachers } from "@/lib/db/schema";
import { validateBody } from "@/lib/api-validation";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import { recalculateComplianceStatus } from "@/lib/compliance-checks";

const verifyRejectSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    expiryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
      .optional(),
  }),
  z.object({
    action: z.literal("reject"),
    rejectionReason: z
      .string()
      .min(1, "Rejection reason is required")
      .max(500, "Rejection reason must be 500 characters or fewer"),
  }),
]);

/** PATCH: Verify or reject a compliance document. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const doc = db
    .select()
    .from(complianceDocuments)
    .where(eq(complianceDocuments.id, id))
    .get();

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const parsed = await validateBody(request, verifyRejectSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date();

  if (parsed.data.action === "verify") {
    db.update(complianceDocuments)
      .set({
        status: "verified",
        verifiedAt: now,
        verifiedBy: session.userId,
        expiryDate: parsed.data.expiryDate ?? null,
        rejectionReason: null,
      })
      .where(eq(complianceDocuments.id, id))
      .run();

    // If verifying a DBS document, also update the teacher's dbsStatus and dbsExpiry
    if (doc.documentType === "dbs") {
      db.update(teachers)
        .set({
          dbsStatus: "clear",
          dbsExpiry: parsed.data.expiryDate ?? null,
        })
        .where(eq(teachers.id, doc.teacherId))
        .run();
    }

    // If verifying a right_to_work document, update the teacher's rightToWork
    if (doc.documentType === "right_to_work") {
      db.update(teachers)
        .set({ rightToWork: "verified" })
        .where(eq(teachers.id, doc.teacherId))
        .run();
    }

    createNotification({
      recipientType: "teacher",
      recipientId: doc.teacherId,
      type: "reminder",
      title: "Document Verified",
      body: `Your ${formatDocType(doc.documentType)} has been verified.`,
      relatedEntityType: "compliance_document",
      relatedEntityId: id,
    });
  } else {
    db.update(complianceDocuments)
      .set({
        status: "rejected",
        rejectionReason: parsed.data.rejectionReason,
      })
      .where(eq(complianceDocuments.id, id))
      .run();

    createNotification({
      recipientType: "teacher",
      recipientId: doc.teacherId,
      type: "reminder",
      title: "Document Rejected",
      body: `Your ${formatDocType(doc.documentType)} was rejected: ${parsed.data.rejectionReason}`,
      relatedEntityType: "compliance_document",
      relatedEntityId: id,
    });
  }

  // Recalculate teacher compliance status
  recalculateComplianceStatus(doc.teacherId);

  logActivity(session.userId, "agent", "compliance_updated", "compliance_document", id, {
    teacherId: doc.teacherId,
    documentType: doc.documentType,
    action: parsed.data.action,
  });

  return NextResponse.json({ success: true });
}

function formatDocType(type: string): string {
  const labels: Record<string, string> = {
    dbs: "DBS Certificate",
    right_to_work: "Right to Work",
    qualification: "Qualification",
    reference: "Reference",
  };
  return labels[type] ?? type;
}
