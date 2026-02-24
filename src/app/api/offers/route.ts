import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleTeacherResponse } from "@/lib/assignment-engine";

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { offerId, response } = body as { offerId: string; response: "accepted" | "declined" };

  if (!offerId || !response) {
    return NextResponse.json({ error: "Missing offerId or response" }, { status: 400 });
  }

  const result = handleTeacherResponse(offerId, response);
  return NextResponse.json(result);
}
