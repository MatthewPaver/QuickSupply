"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

interface PendingDocument {
  id: string;
  teacherId: string;
  teacherFirstName: string;
  teacherLastName: string;
  documentType: string;
  fileName: string;
  filePath: string;
  status: string;
  expiryDate: string | null;
  rejectionReason: string | null;
  uploadedAt: Date | string;
  verifiedAt: Date | string | null;
  createdAt: Date | string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  dbs: "DBS Certificate",
  right_to_work: "Right to Work",
  qualification: "Qualification",
  reference: "Reference",
};

export function DocumentVerificationTable({
  documents: initialDocuments,
}: {
  documents: PendingDocument[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [verifyDialog, setVerifyDialog] = useState<PendingDocument | null>(null);
  const [rejectDialog, setRejectDialog] = useState<PendingDocument | null>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  async function handleVerify() {
    if (!verifyDialog) return;
    setProcessing(true);
    try {
      const body: Record<string, string> = { action: "verify" };
      if (expiryDate) body.expiryDate = expiryDate;

      const res = await fetch(
        `/api/agency/compliance/documents/${verifyDialog.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Verification failed");
      }

      toast.success(
        `${DOC_TYPE_LABELS[verifyDialog.documentType] ?? verifyDialog.documentType} verified for ${verifyDialog.teacherFirstName} ${verifyDialog.teacherLastName}.`
      );
      setDocuments((prev) => prev.filter((d) => d.id !== verifyDialog.id));
      setVerifyDialog(null);
      setExpiryDate("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectDialog) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection.");
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(
        `/api/agency/compliance/documents/${rejectDialog.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "reject",
            rejectionReason: rejectionReason.trim(),
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Rejection failed");
      }

      toast.success(
        `${DOC_TYPE_LABELS[rejectDialog.documentType] ?? rejectDialog.documentType} rejected for ${rejectDialog.teacherFirstName} ${rejectDialog.teacherLastName}.`
      );
      setDocuments((prev) => prev.filter((d) => d.id !== rejectDialog.id));
      setRejectDialog(null);
      setRejectionReason("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rejection failed";
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        All documents have been processed.
      </p>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead>Document Type</TableHead>
            <TableHead>File</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                {doc.teacherFirstName} {doc.teacherLastName}
              </TableCell>
              <TableCell>
                {DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType}
              </TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {doc.fileName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(doc.uploadedAt), "d MMM yyyy")}
              </TableCell>
              <TableCell>
                <StatusBadge status="pending-compliance" />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`/api/agency/compliance/file?path=${encodeURIComponent(doc.filePath)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      View
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setVerifyDialog(doc);
                      setExpiryDate("");
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-emerald-600" />
                    Verify
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectDialog(doc);
                      setRejectionReason("");
                    }}
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5 text-destructive" />
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Verify Dialog */}
      <Dialog
        open={verifyDialog !== null}
        onOpenChange={(open) => {
          if (!open) setVerifyDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Verify{" "}
              {verifyDialog
                ? `${DOC_TYPE_LABELS[verifyDialog.documentType] ?? verifyDialog.documentType} for ${verifyDialog.teacherFirstName} ${verifyDialog.teacherLastName}`
                : "this document"}
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Expiry Date (optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if the document does not expire.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerifyDialog(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Verification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialog !== null}
        onOpenChange={(open) => {
          if (!open) setRejectDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Document</DialogTitle>
            <DialogDescription>
              Reject{" "}
              {rejectDialog
                ? `${DOC_TYPE_LABELS[rejectDialog.documentType] ?? rejectDialog.documentType} for ${rejectDialog.teacherFirstName} ${rejectDialog.teacherLastName}`
                : "this document"}
              . The teacher will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>
                Reason for Rejection <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Document is expired, image is unclear..."
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialog(null)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
