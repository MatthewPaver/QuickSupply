import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Returns current session for client-side SSE subscription (userId, role, name). */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    userId: session.userId,
    role: session.role,
    name: session.name,
  });
}
