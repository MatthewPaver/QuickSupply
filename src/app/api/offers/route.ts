import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientIdentifier, rateLimitApi } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { assignmentOffers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handleTeacherResponse } from "@/lib/assignment-engine";

export async function PATCH(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (await rateLimitApi(identifier)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { offerId, response } = body as { offerId: string; response: string };

  if (!offerId || !response) {
    return NextResponse.json({ error: "Missing offerId or response" }, { status: 400 });
  }
  if (response !== "accepted" && response !== "declined") {
    return NextResponse.json({ error: "Response must be 'accepted' or 'declined'" }, { status: 400 });
  }

  const offer = db.select().from(assignmentOffers).where(eq(assignmentOffers.id, offerId)).get();
  if (!offer || offer.teacherId !== session.userId) {
    return NextResponse.json({ error: "Offer not found or you are not the assigned teacher" }, { status: 403 });
  }

  const result = handleTeacherResponse(offerId, response);
  return NextResponse.json(result);
}
