import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

/** GET: Serve an uploaded compliance file. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filePath = request.nextUrl.searchParams.get("path");
  if (!filePath) {
    return NextResponse.json({ error: "path query parameter is required" }, { status: 400 });
  }

  // Security: only serve files from the compliance uploads directory
  if (!filePath.startsWith("uploads/compliance/")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
  }

  // Prevent path traversal
  const normalised = path.normalize(filePath);
  if (normalised.includes("..") || !normalised.startsWith("uploads/compliance/")) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
  }

  const fullPath = path.join(process.cwd(), normalised);
  if (!existsSync(fullPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const ext = path.extname(fullPath).slice(1).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  const buffer = await readFile(fullPath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
