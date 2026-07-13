import { writeFile, mkdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "compliance");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);

// Magic bytes for file type validation (defense against spoofed MIME types)
const FILE_SIGNATURES: Record<string, number[]> = {
  pdf: [0x25, 0x50, 0x44, 0x46],       // %PDF
  jpg: [0xFF, 0xD8, 0xFF],              // JPEG SOI
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],        // .PNG
};

function validateFileSignature(buffer: Buffer, ext: string): boolean {
  const sig = FILE_SIGNATURES[ext];
  if (!sig) return false;
  if (buffer.length < sig.length) return false;
  return sig.every((byte, i) => buffer[i] === byte);
}

export interface UploadResult {
  fileName: string;
  filePath: string;
}

export async function uploadComplianceDocument(
  file: File,
  teacherId: string,
  documentType: string
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size must be under 10MB.");
  }

  // Validate extension
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error("Only PDF, JPG, and PNG files are accepted.");
  }

  // Read buffer and validate magic bytes (defense against spoofed MIME types)
  const buffer = Buffer.from(await file.arrayBuffer());
  if (!validateFileSignature(buffer, ext)) {
    throw new Error("File content does not match the file extension. Please upload a valid PDF, JPG, or PNG.");
  }

  const teacherDir = path.join(UPLOAD_DIR, teacherId);
  if (!existsSync(teacherDir)) {
    await mkdir(teacherDir, { recursive: true });
  }

  const safeName = `${documentType}-${Date.now()}.${ext}`;
  const filePath = path.join(teacherDir, safeName);

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
