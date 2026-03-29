import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { teachers, schools, coverRequests } from "@/lib/db/schema";

const searchQuerySchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters"),
});

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = searchQuerySchema.safeParse({ q: url.searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const query = parsed.data.q;
  const likeQuery = `%${query}%`;

  // Search teachers by first + last name
  const teacherResults = db
    .select({
      id: teachers.id,
      firstName: teachers.firstName,
      lastName: teachers.lastName,
    })
    .from(teachers)
    .where(
      sql`(${teachers.firstName} || ' ' || ${teachers.lastName}) LIKE ${likeQuery}`
    )
    .limit(5)
    .all();

  // Search schools by name
  const schoolResults = db
    .select({
      id: schools.id,
      name: schools.name,
    })
    .from(schools)
    .where(sql`${schools.name} LIKE ${likeQuery}`)
    .limit(5)
    .all();

  // Search cover requests by school name or date
  const requestResults = db
    .select({
      id: coverRequests.id,
      date: coverRequests.date,
      status: coverRequests.status,
      schoolName: schools.name,
    })
    .from(coverRequests)
    .innerJoin(schools, sql`${coverRequests.schoolId} = ${schools.id}`)
    .where(
      sql`${schools.name} LIKE ${likeQuery} OR ${coverRequests.date} LIKE ${likeQuery}`
    )
    .limit(5)
    .all();

  return NextResponse.json({
    success: true,
    teachers: teacherResults.map((t) => ({
      id: t.id,
      label: `${t.firstName} ${t.lastName}`,
    })),
    schools: schoolResults.map((s) => ({
      id: s.id,
      label: s.name,
    })),
    requests: requestResults.map((r) => ({
      id: r.id,
      label: `${r.schoolName} — ${r.date} (${r.status})`,
    })),
  });
}
