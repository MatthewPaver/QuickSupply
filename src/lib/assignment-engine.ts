import { db } from "@/lib/db";
import {
  teachers,
  schools,
  coverRequests,
  assignmentOffers,
  bookings,
  teacherAvailability,
  teacherBlacklistedSchools,
  schoolTeacherReviews,
  teacherSubjects,
  appConfig,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { ulid } from "ulid";
import { haversineDistance } from "@/lib/distance";
import { sseManager } from "@/lib/sse-manager";
import { createNotification, notifyAllAgents } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import type { RankedTeacher } from "@/types";

interface RankingWeights {
  preferred: number;
  rating: number;
  review: number;
  distance: number;
  drive: number;
  familiarity: number;
  subjectMatch: number;
}

const DEFAULT_WEIGHTS: RankingWeights = {
  preferred: 200,
  rating: 20,
  review: 10,
  distance: 30,
  drive: 25,
  familiarity: 15,
  subjectMatch: 30,
};

function loadRankingWeights(): RankingWeights {
  const row = db.select().from(appConfig).where(eq(appConfig.key, "ranking_weights")).get();
  if (!row) return DEFAULT_WEIGHTS;
  try {
    const parsed = JSON.parse(row.value);
    return {
      preferred: typeof parsed.preferred === "number" ? parsed.preferred : DEFAULT_WEIGHTS.preferred,
      rating: typeof parsed.rating === "number" ? parsed.rating : DEFAULT_WEIGHTS.rating,
      review: typeof parsed.review === "number" ? parsed.review : DEFAULT_WEIGHTS.review,
      distance: typeof parsed.distance === "number" ? parsed.distance : DEFAULT_WEIGHTS.distance,
      drive: typeof parsed.drive === "number" ? parsed.drive : DEFAULT_WEIGHTS.drive,
      familiarity: typeof parsed.familiarity === "number" ? parsed.familiarity : DEFAULT_WEIGHTS.familiarity,
      subjectMatch: typeof parsed.subjectMatch === "number" ? parsed.subjectMatch : DEFAULT_WEIGHTS.subjectMatch,
    };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

function getConfigValue(key: string, fallback: number): number {
  const row = db.select().from(appConfig).where(eq(appConfig.key, key)).get();
  return row ? parseInt(row.value, 10) : fallback;
}

export function rankTeachersForRequest(requestId: string): RankedTeacher[] {
  const request = db.select().from(coverRequests).where(eq(coverRequests.id, requestId)).get();
  if (!request) return [];

  // Get school info for distance calc
  const school = db
    .select({ lat: schools.lat, lng: schools.lng })
    .from(schools)
    .where(eq(schools.id, request.schoolId))
    .get();

  if (!school) return [];

  // Load configurable weights
  const weights = loadRankingWeights();

  // Get all active teachers (deactivated teachers are ineligible)
  const allTeachers = db.select().from(teachers).where(eq(teachers.isActive, true)).all();

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
  const dayOfWeek = new Date(request.date + "T00:00:00").getDay();
  const allAvailability = db.select().from(teacherAvailability).all();

  // Get school review averages per teacher (for this school)
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

  // Get all reviews per teacher for affinity scoring
  const allReviews = db.select().from(schoolTeacherReviews).all();
  const teacherAffinityMap = new Map<string, Map<string, { ratings: number[]; rebooks: boolean[] }>>();
  for (const r of allReviews) {
    if (!teacherAffinityMap.has(r.teacherId)) {
      teacherAffinityMap.set(r.teacherId, new Map());
    }
    const schoolMap = teacherAffinityMap.get(r.teacherId)!;
    const entry = schoolMap.get(r.schoolId) ?? { ratings: [], rebooks: [] };
    entry.ratings.push(r.rating);
    entry.rebooks.push(r.wouldRebook);
    schoolMap.set(r.schoolId, entry);
  }

  // Get teachers who previously worked at this school
  const previousWorkers = db
    .select({ teacherId: bookings.teacherId })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .where(eq(coverRequests.schoolId, request.schoolId))
    .all()
    .map((b) => b.teacherId);
  const previousSet = new Set(previousWorkers);

  // Get teacher subjects for subject matching
  const allTeacherSubjects = db.select().from(teacherSubjects).all();
  const teacherSubjectsMap = new Map<string, Set<string>>();
  for (const ts of allTeacherSubjects) {
    if (!teacherSubjectsMap.has(ts.teacherId)) {
      teacherSubjectsMap.set(ts.teacherId, new Set());
    }
    teacherSubjectsMap.get(ts.teacherId)!.add(ts.subject.toLowerCase());
  }

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
      const requestDate = new Date(request.date + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
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

    // Filter: beyond teacher's max travel distance
    if (distanceMiles > teacher.maxDistanceMiles) continue;

    // Score using configurable weights
    let score = 0;
    const isPreferred = request.preferredTeacherId === teacher.id;
    const schoolReviewAvg = reviewAvgMap.get(teacher.id) || null;
    const previouslyWorked = previousSet.has(teacher.id);

    if (isPreferred) score += weights.preferred;
    score += teacher.agencyRating * weights.rating;
    if (schoolReviewAvg) score += schoolReviewAvg * weights.review;
    score += Math.min(weights.distance, weights.distance / Math.max(distanceMiles, 0.5));
    if (teacher.canDrive) score += weights.drive;
    if (previouslyWorked) score += weights.familiarity;

    // Subject matching
    if (request.subject && request.subject.trim() !== "") {
      const teacherSubs = teacherSubjectsMap.get(teacher.id);
      if (teacherSubs && teacherSubs.has(request.subject.toLowerCase())) {
        score += weights.subjectMatch;
      }
    }

    // School affinity from reviews
    const teacherSchoolReviews = teacherAffinityMap.get(teacher.id)?.get(request.schoolId);
    if (teacherSchoolReviews && teacherSchoolReviews.ratings.length > 0) {
      const avgRat = teacherSchoolReviews.ratings.reduce((a, b) => a + b, 0) / teacherSchoolReviews.ratings.length;
      const rebookRate = teacherSchoolReviews.rebooks.filter(Boolean).length / teacherSchoolReviews.rebooks.length;
      const affinityScore = (avgRat / 5) * 0.7 + rebookRate * 0.3;
      score += affinityScore * weights.review;
    }

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

  // If the school requested a preferred teacher and they're not in the list (e.g. filtered by
  // availability), add them at the top so the agency can see and assign them. We only require
  // hard filters: role, compliance, not already booked, not blacklisted, not declined/expired.
  const rankedIds = new Set(ranked.map((r) => r.teacher.id));
  if (request.preferredTeacherId && !rankedIds.has(request.preferredTeacherId)) {
    const preferred = allTeachers.find((t) => t.id === request.preferredTeacherId);
    if (preferred) {
      const isBlacklisted = blacklisted.includes(preferred.id);
      const roleOk =
        (request.roleNeeded === "teacher" && (preferred.roleType === "teacher" || preferred.roleType === "both")) ||
        (request.roleNeeded === "ta" && (preferred.roleType === "ta" || preferred.roleType === "both"));
      if (
        roleOk &&
        preferred.complianceStatus === "compliant" &&
        !existingBookings.includes(preferred.id) &&
        !isBlacklisted &&
        !declinedOrExpired.has(preferred.id)
      ) {
        const distanceMiles = haversineDistance(preferred.lat, preferred.lng, school.lat, school.lng);
        const schoolReviewAvg = reviewAvgMap.get(preferred.id) || null;
        const previouslyWorked = previousSet.has(preferred.id);
        ranked.unshift({
          teacher: preferred,
          score: weights.preferred,
          distanceMiles,
          schoolReviewAvg,
          previouslyWorkedAtSchool: previouslyWorked,
          isPreferred: true,
          isBlacklisted: false,
        });
      }
    }
  }

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

  const school = db.select({ name: schools.name }).from(schools).where(eq(schools.id, request.schoolId)).get();
  const schoolName = school?.name ?? "A school";
  createNotification({
    recipientType: "teacher",
    recipientId: teacher.id,
    type: "offer",
    title: "New job offer",
    body: `${schoolName} – ${request.date} (${request.roleNeeded}${request.keyStage ? `, ${request.keyStage}` : ""}). ${request.startTime}–${request.endTime}. Log in to accept or decline.`,
    relatedEntityType: "assignment_offer",
    relatedEntityId: offerId,
  });

  logActivity("system", "agent", "offer_sent", "assignment_offer", offerId, {
    teacherId: teacher.id,
    teacherName: `${teacher.firstName} ${teacher.lastName}`,
    requestId,
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
    // Conditional update to prevent double-accept race condition
    const result = db.update(assignmentOffers)
      .set({ status: "accepted", responseAt: new Date() })
      .where(and(eq(assignmentOffers.id, offerId), eq(assignmentOffers.status, "pending")))
      .run();

    // If no rows were updated, another request already changed the status
    if (result.changes === 0) {
      return { success: false, message: "Offer is no longer active." };
    }

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

    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "A teacher";
    const schoolRow = db.select({ name: schools.name }).from(schools).where(eq(schools.id, request.schoolId)).get();
    createNotification({
      recipientType: "school",
      recipientId: request.schoolId,
      type: "filled",
      title: "Cover arranged",
      body: `Your request for ${request.date} has been filled by ${teacherName}.`,
      relatedEntityType: "cover_request",
      relatedEntityId: offer.coverRequestId,
    });
    notifyAllAgents("filled", "Request filled", `${schoolRow?.name ?? "A school"} – ${request.date} filled by ${teacherName}.`, "cover_request", offer.coverRequestId);

    logActivity(offer.teacherId, "teacher", "booking_created", "booking", bookingId, {
      coverRequestId: offer.coverRequestId,
      teacherName,
      schoolName: schoolRow?.name ?? "Unknown",
      date: request.date,
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

  const teacherRow = db.select().from(teachers).where(eq(teachers.id, offer.teacherId)).get();
  const declinedName = teacherRow ? `${teacherRow.firstName} ${teacherRow.lastName}` : "A teacher";
  notifyAllAgents("declined", "Offer declined", `${declinedName} declined. Moving to next teacher.`, "cover_request", offer.coverRequestId);

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
    createNotification({
      recipientType: "teacher",
      recipientId: offer.teacherId,
      type: "reminder",
      title: "Offer withdrawn",
      body: "The agency has withdrawn the job offer. You may receive new offers for other dates.",
      relatedEntityType: "assignment_offer",
      relatedEntityId: offer.id,
    });
  }

  // Next offer order (so decline can advance correctly if we ever add more)
  const existingOffers = db
    .select({ offerOrder: assignmentOffers.offerOrder })
    .from(assignmentOffers)
    .where(eq(assignmentOffers.coverRequestId, requestId))
    .all();
  const nextOrder = existingOffers.length === 0 ? 1 : Math.max(...existingOffers.map((o) => o.offerOrder)) + 1;

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
      offerOrder: nextOrder,
      createdAt: new Date(),
    })
    .run();

  db.update(coverRequests).set({ status: "offering" }).where(eq(coverRequests.id, requestId)).run();

  sseManager.emit(`teacher:${teacher.id}`, {
    type: "new_offer",
    data: { offerId, requestId },
  });
  sseManager.emit("agency", {
    type: "offer_sent",
    data: {
      requestId,
      teacherId: teacher.id,
      teacherName: `${teacher.firstName} ${teacher.lastName}`,
      expiresAt: expiresAt.toISOString(),
    },
  });

  const school = db.select({ name: schools.name }).from(schools).where(eq(schools.id, request.schoolId)).get();
  const schoolName = school?.name ?? "A school";
  createNotification({
    recipientType: "teacher",
    recipientId: teacher.id,
    type: "offer",
    title: "New job offer",
    body: `${schoolName} – ${request.date} (${request.roleNeeded}${request.keyStage ? `, ${request.keyStage}` : ""}). ${request.startTime}–${request.endTime}. Log in to accept or decline.`,
    relatedEntityType: "assignment_offer",
    relatedEntityId: offerId,
  });

  return {
    success: true,
    message: `Offer sent to ${teacher.firstName} ${teacher.lastName}. They can accept or decline on their Jobs page.`,
  };
}

/** Withdraw the current pending offer(s) for a request and set request back to pending. */
export function withdrawCurrentOffer(requestId: string): { success: boolean; message: string } {
  const request = db.select().from(coverRequests).where(eq(coverRequests.id, requestId)).get();
  if (!request) return { success: false, message: "Request not found." };

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
    createNotification({
      recipientType: "teacher",
      recipientId: offer.teacherId,
      type: "reminder",
      title: "Offer withdrawn",
      body: "The agency has withdrawn the job offer.",
      relatedEntityType: "assignment_offer",
      relatedEntityId: offer.id,
    });
  }

  db.update(coverRequests).set({ status: "pending" }).where(eq(coverRequests.id, requestId)).run();
  sseManager.emit("agency", {
    type: "offer_withdrawn",
    data: { requestId },
  });

  return { success: true, message: "Offer withdrawn. Request is back to pending." };
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

  const request = db.select().from(coverRequests).where(eq(coverRequests.id, booking.coverRequestId)).get();
  if (request) {
    createNotification({
      recipientType: "school",
      recipientId: request.schoolId,
      type: "cancellation",
      title: "Booking cancelled",
      body: `The booking for ${request.date} has been cancelled by the agency.`,
      relatedEntityType: "booking",
      relatedEntityId: bookingId,
    });
  }
  createNotification({
    recipientType: "teacher",
    recipientId: booking.teacherId,
    type: "cancellation",
    title: "Booking cancelled",
    body: "The agency has cancelled this booking. The request is back to pending.",
    relatedEntityType: "booking",
    relatedEntityId: bookingId,
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
    // Conditional update: only expire if still pending (prevents race with teacher acceptance)
    const result = db.update(assignmentOffers)
      .set({ status: "expired" })
      .where(and(eq(assignmentOffers.id, offer.id), eq(assignmentOffers.status, "pending")))
      .run();

    // If no rows updated, the teacher already accepted/declined — skip auto-advance
    if (result.changes === 0) continue;

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
