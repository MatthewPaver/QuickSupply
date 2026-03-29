import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { complianceDocuments, teachers } from "@/lib/db/schema";

/** GET: All pending-verification documents across all teachers. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = db
    .select({
      id: complianceDocuments.id,
      teacherId: complianceDocuments.teacherId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
      documentType: complianceDocuments.documentType,
      fileName: complianceDocuments.fileName,
      filePath: complianceDocuments.filePath,
      status: complianceDocuments.status,
      expiryDate: complianceDocuments.expiryDate,
      rejectionReason: complianceDocuments.rejectionReason,
      uploadedAt: complianceDocuments.uploadedAt,
      verifiedAt: complianceDocuments.verifiedAt,
      createdAt: complianceDocuments.createdAt,
    })
    .from(complianceDocuments)
    .innerJoin(teachers, eq(complianceDocuments.teacherId, teachers.id))
    .where(eq(complianceDocuments.status, "pending_verification"))
    .all();

  // Sort by uploadedAt descending (newest first)
  docs.sort((a, b) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bTime - aTime;
  });

  return NextResponse.json(docs);
}
