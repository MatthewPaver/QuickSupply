import { requireSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { complianceDocuments, teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ShieldCheck } from "lucide-react";
import { DocumentVerificationTable } from "@/components/agency/document-verification-table";

export default async function AgencyComplianceDocumentsPage() {
  await requireSession("agent");

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

  // Sort by uploadedAt descending
  docs.sort((a, b) => {
    const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
    const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <p className="text-sm text-muted-foreground">Compliance</p>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" />
          Document Verification
        </h1>
      </div>

      {docs.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No documents to review"
          description="Every uploaded document has been verified or rejected."
        />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Pending Verification ({docs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentVerificationTable documents={docs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
