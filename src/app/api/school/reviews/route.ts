import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { schoolTeacherReviews, bookings, coverRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";
import { validateBody, reviewSchema } from "@/lib/api-validation";

/** POST: add or update a school review for a completed booking. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "school") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, reviewSchema);
  if (!parsed.success) return parsed.response;
  const { bookingId, rating, comment } = parsed.data;

  const booking = db.select().from(bookings).where(eq(bookings.id, bookingId)).get();
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const req = db.select().from(coverRequests).where(eq(coverRequests.id, booking.coverRequestId)).get();
  if (!req || req.schoolId !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = db
    .select()
    .from(schoolTeacherReviews)
    .where(eq(schoolTeacherReviews.bookingId, bookingId))
    .get();

  if (existing) {
    db.update(schoolTeacherReviews)
      .set({ rating, comment: comment ?? existing.comment, createdAt: new Date() })
      .where(eq(schoolTeacherReviews.id, existing.id))
      .run();
    return NextResponse.json({ ok: true });
  }

  db.insert(schoolTeacherReviews)
    .values({
      id: ulid(),
      schoolId: session.userId,
      teacherId: booking.teacherId,
      bookingId: booking.id,
      rating,
      comment: comment ?? null,
      createdAt: new Date(),
    })
    .run();

  return NextResponse.json({ ok: true });
}
