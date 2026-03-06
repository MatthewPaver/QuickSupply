import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientIdentifier, rateLimitApi } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { assignmentOffers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { handleTeacherResponse } from "@/lib/assignment-engine";
import { validateBody, offerResponseSchema } from "@/lib/api-validation";

export async function PATCH(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (await rateLimitApi(identifier)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, offerResponseSchema);
  if (!parsed.success) return parsed.response;
  const { offerId, response } = parsed.data;

  const offer = db.select().from(assignmentOffers).where(eq(assignmentOffers.id, offerId)).get();
  if (!offer || offer.teacherId !== session.userId) {
    return NextResponse.json({ error: "Offer not found or you are not the assigned teacher" }, { status: 403 });
  }

  const result = handleTeacherResponse(offerId, response);
  return NextResponse.json(result);
}
