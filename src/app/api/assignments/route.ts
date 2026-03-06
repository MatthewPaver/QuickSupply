import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientIdentifier, rateLimitApi } from "@/lib/rate-limit";
import { startOfferingSequence, manualAssign, cancelBooking, rankTeachersForRequest, withdrawCurrentOffer } from "@/lib/assignment-engine";
import { validateBody, assignmentActionSchema } from "@/lib/api-validation";

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (await rateLimitApi(identifier)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, assignmentActionSchema);
  if (!parsed.success) return parsed.response;
  const data = parsed.data;

  try {
    switch (data.action) {
      case "start_offering": {
        const result = startOfferingSequence(data.requestId);
        return NextResponse.json(result);
      }
      case "manual_assign": {
        const result = manualAssign(data.requestId, data.teacherId);
        return NextResponse.json(result);
      }
      case "cancel_booking": {
        const result = cancelBooking(data.bookingId, data.reason || "Cancelled by agency");
        return NextResponse.json(result);
      }
      case "withdraw_offer": {
        const result = withdrawCurrentOffer(data.requestId);
        return NextResponse.json(result);
      }
      case "rank_teachers": {
        const ranked = rankTeachersForRequest(data.requestId);
        return NextResponse.json(ranked.map((r) => ({
          ...r,
          teacher: {
            id: r.teacher.id,
            firstName: r.teacher.firstName,
            lastName: r.teacher.lastName,
            phone: r.teacher.phone,
            roleType: r.teacher.roleType,
            canDrive: r.teacher.canDrive,
            agencyRating: r.teacher.agencyRating,
            complianceStatus: r.teacher.complianceStatus,
            emergencyAvailable: r.teacher.emergencyAvailable,
          },
        })));
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assignment operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
