import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { getSession } from "@/lib/auth";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

const MAX_SERVE_SIZE = 15 * 1024 * 1024; // 15MB safety limit

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

  // Canonical path traversal defense: compare resolved absolute paths
  const resolvedBase = path.resolve(process.cwd(), "uploads", "compliance");
  const resolvedPath = path.resolve(process.cwd(), filePath);

  if (!resolvedPath.startsWith(resolvedBase + path.sep)) {
    return NextResponse.json({ error: "Invalid file path" }, { status: 403 });
  }

  if (!existsSync(resolvedPath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Check file size before reading into memory
  const fileStat = await stat(resolvedPath);
  if (fileStat.size > MAX_SERVE_SIZE) {
    return NextResponse.json({ error: "File too large" }, { status: 413 });
  }

  const ext = path.extname(resolvedPath).slice(1).toLowerCase();
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";

  const buffer = await readFile(resolvedPath);

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${path.basename(resolvedPath)}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
