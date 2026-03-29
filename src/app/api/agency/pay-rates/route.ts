import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, desc, isNull } from "drizzle-orm";
import { ulid } from "ulid";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { payRates, schools } from "@/lib/db/schema";
import { validateBody } from "@/lib/api-validation";

const createPayRateSchema = z.object({
  roleType: z.enum(["teacher", "ta"], { message: "roleType must be 'teacher' or 'ta'" }),
  schoolId: z.string().min(1).nullable().optional(),
  payRate: z.number().int().min(1, "Pay rate must be at least 1 pence"),
  chargeRate: z.number().int().min(1, "Charge rate must be at least 1 pence"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "effectiveFrom must be YYYY-MM-DD"),
});

/** GET: List all pay rates joined with school names. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch rates with school-specific ones
  const withSchool = db
    .select({
      id: payRates.id,
      roleType: payRates.roleType,
      schoolId: payRates.schoolId,
      schoolName: schools.name,
      payRate: payRates.payRate,
      chargeRate: payRates.chargeRate,
      effectiveFrom: payRates.effectiveFrom,
      createdAt: payRates.createdAt,
    })
    .from(payRates)
    .innerJoin(schools, eq(payRates.schoolId, schools.id))
    .orderBy(payRates.roleType, desc(payRates.effectiveFrom))
    .all();

  // Fetch default rates (schoolId IS NULL)
  const defaults = db
    .select({
      id: payRates.id,
      roleType: payRates.roleType,
      schoolId: payRates.schoolId,
      payRate: payRates.payRate,
      chargeRate: payRates.chargeRate,
      effectiveFrom: payRates.effectiveFrom,
      createdAt: payRates.createdAt,
    })
    .from(payRates)
    .where(isNull(payRates.schoolId))
    .orderBy(payRates.roleType, desc(payRates.effectiveFrom))
    .all();

  const defaultsWithNull = defaults.map((d) => ({
    ...d,
    schoolName: null as string | null,
  }));

  // Merge and sort: roleType asc, effectiveFrom desc
  const all = [...withSchool, ...defaultsWithNull].sort((a, b) => {
    if (a.roleType < b.roleType) return -1;
    if (a.roleType > b.roleType) return 1;
    return b.effectiveFrom.localeCompare(a.effectiveFrom);
  });

  return NextResponse.json({ success: true, payRates: all });
}

/** POST: Create a new pay rate. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, createPayRateSchema);
  if (!parsed.success) return parsed.response;

  const { roleType, schoolId, payRate: payRateVal, chargeRate, effectiveFrom } = parsed.data;

  // If schoolId provided, verify it exists
  if (schoolId) {
    const school = db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .get();
    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }
  }

  const id = ulid();
  const now = new Date();

  db.insert(payRates)
    .values({
      id,
      roleType,
      schoolId: schoolId || null,
      payRate: payRateVal,
      chargeRate,
      effectiveFrom,
      createdAt: now,
    })
    .run();

  return NextResponse.json({ success: true, id }, { status: 201 });
}
