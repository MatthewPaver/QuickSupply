import { NextRequest, NextResponse } from "next/server";
import { checkExpiredOffers } from "@/lib/assignment-engine";

// Cron should be called by a scheduler (e.g. Vercel Cron, GitHub Actions) or internally.
// In production, protect with a shared secret so arbitrary clients cannot trigger it.
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const secret = authHeader?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const expired = checkExpiredOffers();
  return NextResponse.json({ expired });
}
