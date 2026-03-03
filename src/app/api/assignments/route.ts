import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getClientIdentifier, rateLimitApi } from "@/lib/rate-limit";
import { startOfferingSequence, manualAssign, cancelBooking, rankTeachersForRequest, withdrawCurrentOffer } from "@/lib/assignment-engine";

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (rateLimitApi(identifier)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { action, requestId, teacherId, bookingId, reason } = body as {
    action?: string;
    requestId?: string;
    teacherId?: string;
    bookingId?: string;
    reason?: string;
  };

  try {
    switch (action) {
      case "start_offering": {
        const result = startOfferingSequence(requestId!);
        return NextResponse.json(result);
      }
      case "manual_assign": {
        const result = manualAssign(requestId!, teacherId!);
        return NextResponse.json(result);
      }
      case "cancel_booking": {
        const result = cancelBooking(bookingId!, reason || "Cancelled by agency");
        return NextResponse.json(result);
      }
      case "withdraw_offer": {
        const result = withdrawCurrentOffer(requestId!);
        return NextResponse.json(result);
      }
      case "rank_teachers": {
        const ranked = rankTeachersForRequest(requestId!);
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
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Assignment operation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
