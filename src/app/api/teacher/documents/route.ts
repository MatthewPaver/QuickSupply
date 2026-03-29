import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { complianceDocuments } from "@/lib/db/schema";
import { uploadComplianceDocument } from "@/lib/file-storage";

const ALLOWED_TYPES = ["dbs", "right_to_work", "qualification", "reference"] as const;

const uploadSchema = z.object({
  documentType: z.enum(ALLOWED_TYPES, {
    message: "documentType must be one of: dbs, right_to_work, qualification, reference",
  }),
});

/** POST: Upload a compliance document. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const documentType = formData.get("documentType");
  const file = formData.get("file");

  const parsed = uploadSchema.safeParse({ documentType });
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_root";
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return NextResponse.json({ error: "Validation failed", fieldErrors }, { status: 400 });
  }

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "A file is required" }, { status: 400 });
  }

  let uploadResult: { fileName: string; filePath: string };
  try {
    uploadResult = await uploadComplianceDocument(file, session.userId, parsed.data.documentType);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const now = new Date();
  const id = ulid();

  db.insert(complianceDocuments)
    .values({
      id,
      teacherId: session.userId,
      documentType: parsed.data.documentType,
      fileName: uploadResult.fileName,
      filePath: uploadResult.filePath,
      status: "pending_verification",
      uploadedAt: now,
      createdAt: now,
    })
    .run();

  const doc = db
    .select()
    .from(complianceDocuments)
    .where(eq(complianceDocuments.id, id))
    .get();

  return NextResponse.json({ success: true, document: doc }, { status: 201 });
}

/** GET: List the teacher's non-archived documents. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docs = db
    .select()
    .from(complianceDocuments)
    .where(eq(complianceDocuments.teacherId, session.userId))
    .all()
    .filter((d) => d.archivedAt === null);

  return NextResponse.json(docs);
}
