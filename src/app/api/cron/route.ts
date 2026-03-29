import { NextRequest, NextResponse } from "next/server";
import { checkExpiredOffers } from "@/lib/assignment-engine";
import {
  cleanupExpiredPasswordResetTokens,
  cleanupOldReadNotifications,
} from "@/lib/maintenance";
import {
  checkExpiringDocuments,
  expireDocuments,
} from "@/lib/compliance-checks";

// Cron should be called by a scheduler (e.g. Vercel Cron, GitHub Actions) or internally.
// In production, protect with a shared secret so arbitrary clients cannot trigger it.
const CRON_SECRET = process.env.CRON_SECRET;
const DEFAULT_NOTIFICATION_RETENTION_DAYS = 30;

function getNotificationRetentionDays(): number {
  const raw = Number(process.env.NOTIFICATION_RETENTION_DAYS ?? "");
  if (Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return DEFAULT_NOTIFICATION_RETENTION_DAYS;
}

export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get("authorization");
    const secret = authHeader?.replace(/^Bearer\s+/i, "") ?? request.nextUrl.searchParams.get("secret");
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV !== "development") {
    // Require CRON_SECRET in all non-development environments (production, staging, preview)
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const expiredOffers = checkExpiredOffers();
  const deletedResetTokens = cleanupExpiredPasswordResetTokens();
  const deletedReadNotifications = cleanupOldReadNotifications(
    getNotificationRetentionDays()
  );
  const expiredDocuments = expireDocuments();
  const expiryAlertsSent = checkExpiringDocuments();

  return NextResponse.json({
    expiredOffers,
    deletedResetTokens,
    deletedReadNotifications,
    expiredDocuments,
    expiryAlertsSent,
  });
}
