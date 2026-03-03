import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { coverRequests, teachers, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { getSession } from "@/lib/auth";
import { sseManager } from "@/lib/sse-manager";
import { notifyAllAgents } from "@/lib/notifications";
import { getClientIdentifier, rateLimitApi } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request);
  if (await rateLimitApi(identifier)) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Only schools may create cover requests, and only for their own school
  if (session.role !== "school") {
    return NextResponse.json({ error: "Forbidden: only schools can create cover requests" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { schoolId, date, roleNeeded, subject, keyStage, startTime, endTime, notes, preferredTeacherId, isEmergency } = body;

  if (!schoolId || !date || !roleNeeded) {
    return NextResponse.json({ error: "Missing required fields: schoolId, date, roleNeeded" }, { status: 400 });
  }
  // School cannot create requests for another school
  if (schoolId !== session.userId) {
    return NextResponse.json({ error: "Forbidden: you can only create requests for your own school" }, { status: 403 });
  }

  // If preferred teacher is set, validate they exist and their role matches the request
  if (preferredTeacherId) {
    const teacher = db.select().from(teachers).where(eq(teachers.id, preferredTeacherId)).get();
    if (!teacher) {
      return NextResponse.json({ error: "Preferred teacher not found." }, { status: 400 });
    }
    const roleMatch =
      (roleNeeded === "teacher" && (teacher.roleType === "teacher" || teacher.roleType === "both")) ||
      (roleNeeded === "ta" && (teacher.roleType === "ta" || teacher.roleType === "both"));
    if (!roleMatch) {
      return NextResponse.json(
        { error: `Preferred teacher (${teacher.firstName} ${teacher.lastName}) is a ${teacher.roleType}, but this request is for a ${roleNeeded}. Please pick a teacher who can cover that role or leave preferred teacher blank.` },
        { status: 400 }
      );
    }
  }

  const id = ulid();
  db.insert(coverRequests)
    .values({
      id,
      schoolId,
      date,
      roleNeeded,
      subject: subject ?? null,
      keyStage: keyStage ?? null,
      startTime: startTime ?? "08:30",
      endTime: endTime ?? "15:30",
      notes: notes ?? null,
      preferredTeacherId: preferredTeacherId ?? null,
      isEmergency: isEmergency ?? false,
      status: "pending",
      createdAt: new Date(),
    })
    .run();

  // Notify agency dashboard via SSE
  sseManager.emit("agency", {
    type: "new_request",
    data: { requestId: id, schoolId, date, roleNeeded },
  });

  // In-app notifications and email for all agents
  const school = db.select({ name: schools.name }).from(schools).where(eq(schools.id, schoolId)).get();
  const schoolName = school?.name ?? "A school";
  const notifBody = `${schoolName} has submitted a new cover request for ${date} (${roleNeeded}). Log in to assign a teacher.`;
  notifyAllAgents("reminder", "New cover request", notifBody, "cover_request", id);

  return NextResponse.json({ id });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const query = db.select().from(coverRequests).orderBy(desc(coverRequests.createdAt));

  // Scope by role: schools see only their requests; agents see all (optionally filtered by schoolId)
  if (session.role === "school") {
    const results = query.all().filter((r) => {
      if (r.schoolId !== session.userId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
    return NextResponse.json(results);
  }
  if (session.role === "teacher") {
    return NextResponse.json({ error: "Forbidden: teachers cannot list cover requests" }, { status: 403 });
  }

  // Agent: allow optional schoolId filter
  const schoolId = searchParams.get("schoolId");
  const results = query.all().filter((r) => {
    if (schoolId && r.schoolId !== schoolId) return false;
    if (status && r.status !== status) return false;
    return true;
  });
  return NextResponse.json(results);
}
