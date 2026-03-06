import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, teacherProfileSchema } from "@/lib/api-validation";

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

  const parsed = await validateBody(request, teacherProfileSchema);
  if (!parsed.success) return parsed.response;
  const { canDrive, maxDistanceMiles, emergencyAvailable, contactNightBeforeOnly, longTermWilling, roleType } = parsed.data;

  const setFields: {
    canDrive: boolean;
    maxDistanceMiles: number;
    emergencyAvailable: boolean;
    contactNightBeforeOnly: boolean;
    longTermWilling: boolean;
    roleType?: "teacher" | "ta" | "both";
  } = {
    canDrive,
    maxDistanceMiles,
    emergencyAvailable,
    contactNightBeforeOnly,
    longTermWilling,
  };
  if (roleType) {
    setFields.roleType = roleType;
  }
  db.update(teachers).set(setFields).where(eq(teachers.id, session.userId)).run();

  return NextResponse.json({ ok: true });
}
