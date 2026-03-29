import { NextResponse } from "next/server";
import { z } from "zod";
import { ulid } from "ulid";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notificationPreferences } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

const CATEGORIES = [
  "offers",
  "booking_confirmations",
  "cancellations",
  "reminders",
  "timesheets",
] as const;

type Category = (typeof CATEGORIES)[number];

const putSchema = z.object({
  category: z.enum(CATEGORIES),
  pushEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

/** Ensure default preferences exist for a user (all categories, all enabled). */
function ensureDefaults(userId: string, userRole: "school" | "teacher" | "agent") {
  const existing = db
    .select({ category: notificationPreferences.category })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, userId),
        eq(notificationPreferences.userRole, userRole)
      )
    )
    .all();

  const existingCategories = new Set(existing.map((r) => r.category));

  for (const category of CATEGORIES) {
    if (!existingCategories.has(category)) {
      db.insert(notificationPreferences)
        .values({
          id: ulid(),
          userId,
          userRole,
          category,
          pushEnabled: true,
          inAppEnabled: true,
        })
        .run();
    }
  }
}

/** GET: Return all notification preferences for the current user. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  ensureDefaults(session.userId, session.role);

  const prefs = db
    .select({
      category: notificationPreferences.category,
      pushEnabled: notificationPreferences.pushEnabled,
      inAppEnabled: notificationPreferences.inAppEnabled,
    })
    .from(notificationPreferences)
    .where(
      and(
        eq(notificationPreferences.userId, session.userId),
        eq(notificationPreferences.userRole, session.role)
      )
    )
    .all();

  return NextResponse.json(prefs);
}

/** PUT: Update a single notification preference category. */
export async function PUT(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid preference data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { category, pushEnabled, inAppEnabled } = parsed.data;

  // Ensure defaults exist first
  ensureDefaults(session.userId, session.role);

  db.update(notificationPreferences)
    .set({ pushEnabled, inAppEnabled })
    .where(
      and(
        eq(notificationPreferences.userId, session.userId),
        eq(notificationPreferences.userRole, session.role),
        eq(notificationPreferences.category, category as Category)
      )
    )
    .run();

  return NextResponse.json({ success: true });
}
