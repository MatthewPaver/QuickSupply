import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentOffers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handleTeacherResponse } from "@/lib/assignment-engine";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { offerId, response } = body as { offerId: string; response: "accepted" | "declined" };

  if (!offerId || !response) {
    return NextResponse.json({ error: "Missing offerId or response" }, { status: 400 });
  }

  const offer = db.select().from(assignmentOffers).where(eq(assignmentOffers.id, offerId)).get();
  if (!offer || offer.teacherId !== session.userId) {
    return NextResponse.json({ error: "Offer not found or you are not the assigned teacher" }, { status: 403 });
  }

  const result = handleTeacherResponse(offerId, response);
  return NextResponse.json(result);
}
