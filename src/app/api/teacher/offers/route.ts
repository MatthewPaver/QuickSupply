import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assignmentOffers, coverRequests, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offers = db
    .select({
      offerId: assignmentOffers.id,
      status: assignmentOffers.status,
      expiresAt: assignmentOffers.expiresAt,
      offeredAt: assignmentOffers.offeredAt,
      date: coverRequests.date,
      roleNeeded: coverRequests.roleNeeded,
      subject: coverRequests.subject,
      keyStage: coverRequests.keyStage,
      startTime: coverRequests.startTime,
      endTime: coverRequests.endTime,
      isEmergency: coverRequests.isEmergency,
      schoolName: schools.name,
    })
    .from(assignmentOffers)
    .innerJoin(coverRequests, eq(assignmentOffers.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(eq(assignmentOffers.teacherId, session.userId))
    .orderBy(desc(assignmentOffers.offeredAt))
    .all();

  return NextResponse.json(offers);
}
