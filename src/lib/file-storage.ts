import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "compliance");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export interface UploadResult {
  fileName: string;
  filePath: string;
}

export async function uploadComplianceDocument(
  file: File,
  teacherId: string,
  documentType: string
): Promise<UploadResult> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Only PDF, JPG, and PNG files are accepted.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be under 10MB.");
  }

  const teacherDir = path.join(UPLOAD_DIR, teacherId);
  if (!existsSync(teacherDir)) {
    await mkdir(teacherDir, { recursive: true });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const safeName = `${documentType}-${Date.now()}.${ext}`;
  const filePath = path.join(teacherDir, safeName);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return {
    fileName: file.name,
    filePath: path.relative(process.cwd(), filePath),
  };
}

export async function deleteComplianceDocument(filePath: string): Promise<void> {
  const fullPath = path.join(process.cwd(), filePath);
  if (existsSync(fullPath)) {
    await unlink(fullPath);
  }
}

export function getFileUrl(filePath: string): string {
  return `/api/agency/compliance/file?path=${encodeURIComponent(filePath)}`;
}
