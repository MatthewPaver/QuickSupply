import { db } from "@/lib/db";
import {
  teachers,
  coverRequests,
  assignmentOffers,
  bookings,
  teacherAvailability,
  teacherBlacklistedSchools,
  schoolTeacherReviews,
  appConfig,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { haversineDistance } from "@/lib/distance";
import { sseManager } from "@/lib/sse-manager";
import type { RankedTeacher, Teacher } from "@/types";

function getConfigValue(key: string, fallback: number): number {
  const row = db.select().from(appConfig).where(eq(appConfig.key, key)).get();
  return row ? parseInt(row.value, 10) : fallback;
}

export function rankTeachersForRequest(requestId: string): RankedTeacher[] {
  const request = db.select().from(coverRequests).where(eq(coverRequests.id, requestId)).get();
  if (!request) return [];

  // Get school info for distance calc
  const school = db
    .select()
    .from(
      sql`schools`
    )
    .where(sql`id = ${request.schoolId}`)
    .get() as { lat: number; lng: number } | undefined;

  if (!school) return [];

  // Get all teachers
  const allTeachers = db.select().from(teachers).all();

  // Get blacklisted schools
  const blacklisted = db
    .select()
    .from(teacherBlacklistedSchools)
    .where(eq(teacherBlacklistedSchools.schoolId, request.schoolId))
    .all()
    .map((b) => b.teacherId);

  // Get existing bookings on this date
  const existingBookings = db
    .select({ teacherId: bookings.teacherId })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(and(eq(coverRequests.date, request.date), sql`${bookings.cancelledAt} IS NULL`))
    .all()
    .map((b) => b.teacherId);

  // Get availability data
  const dayOfWeek = new Date(request.date).getDay();
  const allAvailability = db.select().from(teacherAvailability).all();

  // Get school review averages per teacher
  const reviews = db.select().from(schoolTeacherReviews).where(eq(schoolTeacherReviews.schoolId, request.schoolId)).all();
  const reviewAvgMap = new Map<string, number>();
  const reviewCounts = new Map<string, { sum: number; count: number }>();
  reviews.forEach((r) => {
    const cur = reviewCounts.get(r.teacherId) || { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    reviewCounts.set(r.teacherId, cur);
  });
  reviewCounts.forEach((v, k) => reviewAvgMap.set(k, v.sum / v.count));

  // Get teachers who previously worked at this school
  const previousWorkers = db
    .select({ teacherId: bookings.teacherId })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(eq(coverRequests.schoolId, request.schoolId))
    .all()
    .map((b) => b.teacherId);
  const previousSet = new Set(previousWorkers);

  // Already offered for this request (declined/expired - skip them for re-ranking)
  const pastOffers = db
    .select()
    .from(assignmentOffers)
    .where(eq(assignmentOffers.coverRequestId, requestId))
    .all();
  const declinedOrExpired = new Set(
    pastOffers
      .filter((o) => o.status === "declined" || o.status === "expired")
      .map((o) => o.teacherId)
  );

  const ranked: RankedTeacher[] = [];

  for (const teacher of allTeachers) {
    const isBlacklisted = blacklisted.includes(teacher.id);

    // Filter: role must match
    if (
      request.roleNeeded === "teacher" &&
      teacher.roleType !== "teacher" &&
      teacher.roleType !== "both"
    )
      continue;
    if (
      request.roleNeeded === "ta" &&
      teacher.roleType !== "ta" &&
      teacher.roleType !== "both"
    )
      continue;

    // Filter: compliance
    if (teacher.complianceStatus !== "compliant") continue;

    // Filter: not already booked on this date
    if (existingBookings.includes(teacher.id)) continue;

    // Filter: blacklisted
    if (isBlacklisted) continue;

    // Filter: already declined/expired for this request
    if (declinedOrExpired.has(teacher.id)) continue;

    // Filter: emergency availability
    if (request.isEmergency && !teacher.emergencyAvailable) continue;

    // Filter: contact night before only
    if (teacher.contactNightBeforeOnly) {
      const requestDate = new Date(request.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Only include if request is for tomorrow or today
      if (requestDate > tomorrow) continue;
    }

    // Check availability
    const teacherAvail = allAvailability.filter((a) => a.teacherId === teacher.id);

    // Check specific date first
    const specificDate = teacherAvail.find(
      (a) => !a.isRecurring && a.date === request.date
    );
    if (specificDate) {
      if (!specificDate.isAvailable) continue;
    } else {
      // Check recurring pattern
      const recurring = teacherAvail.find(
        (a) => a.isRecurring && a.dayOfWeek === dayOfWeek
      );
      if (recurring && !recurring.isAvailable) continue;
      // If no data at all, default to available
    }

    // Calculate distance
    const distanceMiles = haversineDistance(teacher.lat, teacher.lng, school.lat, school.lng);

    // Score
    let score = 0;
    const isPreferred = request.preferredTeacherId === teacher.id;
    const schoolReviewAvg = reviewAvgMap.get(teacher.id) || null;
    const previouslyWorked = previousSet.has(teacher.id);

    if (isPreferred) score += 200;
    score += teacher.agencyRating * 20;
    if (schoolReviewAvg) score += schoolReviewAvg * 10;
    score += Math.min(30, 30 / Math.max(distanceMiles, 0.5));
    if (teacher.canDrive) score += 25;
    if (previouslyWorked) score += 15;

    ranked.push({
      teacher,
      score,
      distanceMiles,
      schoolReviewAvg,
      previouslyWorkedAtSchool: previouslyWorked,
      isPreferred,
      isBlacklisted: false,
    });
  }

  // Sort by score descending
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}

export function startOfferingSequence(requestId: string): { offerId: string | null; message: string } {
  const ranked = rankTeachersForRequest(requestId);

  if (ranked.length === 0) {
    return { offerId: null, message: "No eligible teachers found for this request." };
  }

  return offerToNextTeacher(requestId, ranked, 1);
}

export function offerToNextTeacher(
  requestId: string,
  rankedList: RankedTeacher[],
  offerOrder: number
): { offerId: string | null; message: string } {
  if (offerOrder > rankedList.length) {
    db.update(coverRequests).set({ status: "pending" }).where(eq(coverRequests.id, requestId)).run();
    sseManager.emit("agency", {
      type: "offer_expired",
      data: { requestId, message: "All teachers exhausted. Manual intervention needed." },
    });
    return { offerId: null, message: "All eligible teachers exhausted." };
  }

  const teacher = rankedList[offerOrder - 1].teacher;
  const request = db.select().from(coverRequests).where(eq(coverRequests.id, requestId)).get();
  if (!request) return { offerId: null, message: "Request not found." };

  // Determine response window
  const windowMinutes = request.isEmergency
    ? getConfigValue("morning_response_window_minutes", 7)
    : getConfigValue("next_day_response_window_minutes", 60);

  const offeredAt = new Date();
  const expiresAt = new Date(offeredAt.getTime() + windowMinutes * 60 * 1000);

  const offerId = ulid();
  db.insert(assignmentOffers)
    .values({
      id: offerId,
      coverRequestId: requestId,
      teacherId: teacher.id,
      offeredAt,
      expiresAt,
      status: "pending",
      offerOrder,
      createdAt: new Date(),
    })
    .run();

  db.update(coverRequests).set({ status: "offering" }).where(eq(coverRequests.id, requestId)).run();

  // SSE notifications
  sseManager.emit(`teacher:${teacher.id}`, {
    type: "new_offer",
    data: { offerId, requestId },
  });
  sseManager.emit("agency", {
    type: "offer_sent",
    data: { requestId, teacherId: teacher.id, teacherName: `${teacher.firstName} ${teacher.lastName}`, expiresAt: expiresAt.toISOString() },
  });

  return { offerId, message: `Offer sent to ${teacher.firstName} ${teacher.lastName}` };
}

export function handleTeacherResponse(
  offerId: string,
  response: "accepted" | "declined"
): { success: boolean; message: string } {
  const offer = db.select().from(assignmentOffers).where(eq(assignmentOffers.id, offerId)).get();
  if (!offer) return { success: false, message: "Offer not found." };
  if (offer.status !== "pending") return { success: false, message: "Offer is no longer active." };

  const request = db.select().from(coverRequests).where(eq(coverRequests.id, offer.coverRequestId)).get();
  if (!request) return { success: false, message: "Request not found." };

  if (response === "accepted") {
    db.update(assignmentOffers)
      .set({ status: "accepted", responseAt: new Date() })
      .where(eq(assignmentOffers.id, offerId))
      .run();

    const bookingId = ulid();
    db.insert(bookings)
      .values({
        id: bookingId,
        coverRequestId: offer.coverRequestId,
        teacherId: offer.teacherId,
        confirmedAt: new Date(),
        createdAt: new Date(),
      })
      .run();

    db.update(coverRequests)
      .set({ status: "filled" })
      .where(eq(coverRequests.id, offer.coverRequestId))
      .run();

    const teacher = db.select().from(teachers).where(eq(teachers.id, offer.teacherId)).get();

    sseManager.emit("agency", {
      type: "request_filled",
      data: { requestId: offer.coverRequestId, teacherId: offer.teacherId, teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : "Unknown" },
    });
    sseManager.emit(`school:${request.schoolId}`, {
      type: "request_filled",
      data: { requestId: offer.coverRequestId },
    });

    return { success: true, message: "Job accepted and booking confirmed." };
  }

  // Declined
  db.update(assignmentOffers)
    .set({ status: "declined", responseAt: new Date() })
    .where(eq(assignmentOffers.id, offerId))
    .run();

  sseManager.emit("agency", {
    type: "offer_declined",
    data: { requestId: offer.coverRequestId, teacherId: offer.teacherId },
  });

  // Auto-advance to next teacher
  const ranked = rankTeachersForRequest(offer.coverRequestId);
  const nextOrder = offer.offerOrder + 1;
  offerToNextTeacher(offer.coverRequestId, ranked, nextOrder);

  return { success: true, message: "Job declined. Offering to next teacher." };
}

export function manualAssign(requestId: string, teacherId: string): { success: boolean; message: string } {
  const request = db.select().from(coverRequests).where(eq(coverRequests.id, requestId)).get();
  if (!request) return { success: false, message: "Request not found." };

  const teacher = db.select().from(teachers).where(eq(teachers.id, teacherId)).get();
  if (!teacher) return { success: false, message: "Teacher not found." };

  // Withdraw any active offers
  const activeOffers = db
    .select()
    .from(assignmentOffers)
    .where(and(eq(assignmentOffers.coverRequestId, requestId), eq(assignmentOffers.status, "pending")))
    .all();

  for (const offer of activeOffers) {
    db.update(assignmentOffers)
      .set({ status: "withdrawn" })
      .where(eq(assignmentOffers.id, offer.id))
      .run();
    sseManager.emit(`teacher:${offer.teacherId}`, {
      type: "offer_withdrawn",
      data: { offerId: offer.id },
    });
  }

  // Create booking directly
  const bookingId = ulid();
  db.insert(bookings)
    .values({
      id: bookingId,
      coverRequestId: requestId,
      teacherId,
      confirmedAt: new Date(),
      createdAt: new Date(),
    })
    .run();

  db.update(coverRequests).set({ status: "filled" }).where(eq(coverRequests.id, requestId)).run();

  sseManager.emit("agency", {
    type: "request_filled",
    data: { requestId, teacherId, teacherName: `${teacher.firstName} ${teacher.lastName}` },
  });
  sseManager.emit(`school:${request.schoolId}`, {
    type: "request_filled",
    data: { requestId },
  });

  return { success: true, message: `${teacher.firstName} ${teacher.lastName} manually assigned.` };
}

export function cancelBooking(
  bookingId: string,
  reason: string
): { success: boolean; message: string } {
  const booking = db.select().from(bookings).where(eq(bookings.id, bookingId)).get();
  if (!booking) return { success: false, message: "Booking not found." };

  db.update(bookings)
    .set({ cancelledAt: new Date(), cancelledBy: "agent", cancellationReason: reason })
    .where(eq(bookings.id, bookingId))
    .run();

  db.update(coverRequests)
    .set({ status: "pending" })
    .where(eq(coverRequests.id, booking.coverRequestId))
    .run();

  sseManager.emit("agency", {
    type: "booking_cancelled",
    data: { bookingId, coverRequestId: booking.coverRequestId, teacherId: booking.teacherId },
  });

  return { success: true, message: "Booking cancelled. Request is back to pending." };
}

export function checkExpiredOffers(): number {
  const now = new Date();
  const expired = db
    .select()
    .from(assignmentOffers)
    .where(eq(assignmentOffers.status, "pending"))
    .all()
    .filter((o) => o.expiresAt <= now);

  for (const offer of expired) {
    db.update(assignmentOffers)
      .set({ status: "expired" })
      .where(eq(assignmentOffers.id, offer.id))
      .run();

    sseManager.emit("agency", {
      type: "offer_expired",
      data: { offerId: offer.id, requestId: offer.coverRequestId, teacherId: offer.teacherId },
    });

    // Auto-advance
    const ranked = rankTeachersForRequest(offer.coverRequestId);
    const nextOrder = offer.offerOrder + 1;
    offerToNextTeacher(offer.coverRequestId, ranked, nextOrder);
  }

  return expired.length;
}
