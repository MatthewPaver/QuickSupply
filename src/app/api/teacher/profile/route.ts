import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = db.select().from(teachers).where(eq(teachers.id, session.userId)).get();
  if (!teacher) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    canDrive: teacher.canDrive,
    maxDistanceMiles: teacher.maxDistanceMiles,
    emergencyAvailable: teacher.emergencyAvailable,
    contactNightBeforeOnly: teacher.contactNightBeforeOnly,
    longTermWilling: teacher.longTermWilling,
    roleType: teacher.roleType,
    complianceStatus: teacher.complianceStatus,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.canDrive !== "boolean" || typeof body.maxDistanceMiles !== "number" ||
      typeof body.emergencyAvailable !== "boolean" || typeof body.contactNightBeforeOnly !== "boolean" ||
      typeof body.longTermWilling !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid profile fields" }, { status: 400 });
  }

  const setFields: {
    canDrive: boolean;
    maxDistanceMiles: number;
    emergencyAvailable: boolean;
    contactNightBeforeOnly: boolean;
    longTermWilling: boolean;
    roleType?: "teacher" | "ta" | "both";
  } = {
    canDrive: body.canDrive,
    maxDistanceMiles: body.maxDistanceMiles,
    emergencyAvailable: body.emergencyAvailable,
    contactNightBeforeOnly: body.contactNightBeforeOnly,
    longTermWilling: body.longTermWilling,
  };
  if (body.roleType === "teacher" || body.roleType === "ta" || body.roleType === "both") {
    setFields.roleType = body.roleType;
  }
  db.update(teachers).set(setFields).where(eq(teachers.id, session.userId)).run();

  return NextResponse.json({ ok: true });
}
