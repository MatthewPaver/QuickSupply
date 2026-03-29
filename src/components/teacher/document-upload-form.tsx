"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { Loader2, Upload, FileText, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

const DOCUMENT_TYPES = [
  { value: "dbs", label: "DBS Certificate" },
  { value: "right_to_work", label: "Right to Work" },
  { value: "qualification", label: "Qualification" },
  { value: "reference", label: "Reference" },
] as const;

const ACCEPTED_FILE_TYPES = ".pdf,.jpg,.jpeg,.png";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ComplianceDocument {
  id: string;
  teacherId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  status: string;
  expiryDate: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
  verifiedAt: string | null;
  createdAt: string;
}

export function DocumentUploadForm() {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    try {
      const res = await fetch("/api/teacher/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocuments(data);
    } catch {
      toast.error("Could not load documents.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!documentType) {
      toast.error("Please select a document type.");
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Please select a file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size must be under 10MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", file);

      const res = await fetch("/api/teacher/documents", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      toast.success("Document uploaded successfully.");
      setDocumentType("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadDocuments();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      toast.error(message);
    } finally {
      setUploading(false);
    }
  }

  function getDocTypeLabel(type: string): string {
    const found = DOCUMENT_TYPES.find((d) => d.value === type);
    return found?.label ?? type;
  }

  function getStatusBadgeKey(status: string) {
    switch (status) {
      case "verified":
        return "compliant" as const;
      case "pending_verification":
        return "pending-compliance" as const;
      case "rejected":
        return "declined" as const;
      case "expired":
        return "expired-compliance" as const;
      default:
        return status;
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4" />
            Upload Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>File (PDF, JPG, or PNG &mdash; max 10MB)</Label>
            <Input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_TYPES}
            />
          </div>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Your Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No documents uploaded yet. Upload your DBS certificate and right to work document to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">
                        {getDocTypeLabel(doc.documentType)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {doc.fileName} &middot;{" "}
                        {format(new Date(doc.uploadedAt), "d MMM yyyy")}
                      </div>
                      {doc.rejectionReason && (
                        <div className="text-xs text-destructive mt-1">
                          Reason: {doc.rejectionReason}
                        </div>
                      )}
                      {doc.expiryDate && doc.status === "verified" && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Expires: {format(new Date(doc.expiryDate + "T00:00:00"), "d MMM yyyy")}
                        </div>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={getStatusBadgeKey(doc.status)} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
