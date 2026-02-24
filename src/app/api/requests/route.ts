import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coverRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { getSession } from "@/lib/auth";
import { sseManager } from "@/lib/sse-manager";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const id = ulid();
  db.insert(coverRequests)
    .values({
      id,
      schoolId: body.schoolId,
      date: body.date,
      roleNeeded: body.roleNeeded,
      subject: body.subject,
      keyStage: body.keyStage,
      startTime: body.startTime,
      endTime: body.endTime,
      notes: body.notes,
      preferredTeacherId: body.preferredTeacherId,
      isEmergency: body.isEmergency,
      status: "pending",
      createdAt: new Date(),
    })
    .run();

  // Notify agency dashboard via SSE
  sseManager.emit("agency", {
    type: "new_request",
    data: { requestId: id, schoolId: body.schoolId, date: body.date, roleNeeded: body.roleNeeded },
  });

  return NextResponse.json({ id });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId");
  const status = searchParams.get("status");

  let query = db.select().from(coverRequests).orderBy(desc(coverRequests.createdAt));

  const results = query.all().filter((r) => {
    if (schoolId && r.schoolId !== schoolId) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  return NextResponse.json(results);
}
