import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignmentOffers, teachers, coverRequests, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offers = db
    .select({
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
      status: assignmentOffers.status,
      offeredAt: assignmentOffers.offeredAt,
      responseAt: assignmentOffers.responseAt,
      schoolName: schools.name,
    })
    .from(assignmentOffers)
    .innerJoin(teachers, eq(assignmentOffers.teacherId, teachers.id))
    .innerJoin(coverRequests, eq(assignmentOffers.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .orderBy(desc(assignmentOffers.offeredAt))
    .limit(50)
    .all();

  const entries: { at: string; message: string }[] = [];
  for (const o of offers) {
    const name = `${o.teacherFirstName} ${o.teacherLastName}`;
    entries.push({
      at: new Date(o.offeredAt).toISOString(),
      message: `Offer sent to ${name} for ${o.schoolName}`,
    });
    if (o.status === "accepted" && o.responseAt) {
      entries.push({ at: new Date(o.responseAt).toISOString(), message: `${name} accepted` });
    } else if (o.status === "declined" && o.responseAt) {
      entries.push({ at: new Date(o.responseAt).toISOString(), message: `${name} declined` });
    } else if (o.status === "expired") {
      entries.push({ at: new Date(o.offeredAt).toISOString(), message: `Offer to ${name} expired` });
    }
  }
  entries.sort((a, b) => b.at.localeCompare(a.at));
  return NextResponse.json(entries.slice(0, 30));
}
