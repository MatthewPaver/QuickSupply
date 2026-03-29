import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq, and, gte, lte, desc, notInArray } from "drizzle-orm";
import { ulid } from "ulid";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceLineItems,
  timesheets,
  bookings,
  coverRequests,
  teachers,
  schools,
} from "@/lib/db/schema";
import { validateBody } from "@/lib/api-validation";
import { lookupPayRate } from "@/lib/pay-rate-lookup";

const generateInvoiceSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "periodStart must be YYYY-MM-DD"),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "periodEnd must be YYYY-MM-DD"),
});

/** GET: List all invoices with school names. */
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = db
    .select({
      id: invoices.id,
      schoolId: invoices.schoolId,
      schoolName: schools.name,
      periodStart: invoices.periodStart,
      periodEnd: invoices.periodEnd,
      totalPayAmount: invoices.totalPayAmount,
      totalChargeAmount: invoices.totalChargeAmount,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(schools, eq(invoices.schoolId, schools.id))
    .orderBy(desc(invoices.createdAt))
    .all();

  return NextResponse.json({ success: true, invoices: rows });
}

/** POST: Generate an invoice for approved timesheets in period. */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, generateInvoiceSchema);
  if (!parsed.success) return parsed.response;

  const { schoolId, periodStart, periodEnd } = parsed.data;

  // Verify school exists
  const school = db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .where(eq(schools.id, schoolId))
    .get();

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Find IDs of timesheets already on an invoice
  const existingLineItems = db
    .select({ timesheetId: invoiceLineItems.timesheetId })
    .from(invoiceLineItems)
    .all();
  const invoicedTimesheetIds = existingLineItems.map((li) => li.timesheetId);

  // Build where conditions
  const conditions = [
    eq(coverRequests.schoolId, schoolId),
    eq(timesheets.status, "approved"),
    gte(coverRequests.date, periodStart),
    lte(coverRequests.date, periodEnd),
  ];

  if (invoicedTimesheetIds.length > 0) {
    conditions.push(notInArray(timesheets.id, invoicedTimesheetIds));
  }

  // Find approved timesheets for this school in the period that aren't already invoiced
  const eligibleTimesheets = db
    .select({
      timesheetId: timesheets.id,
      bookingId: timesheets.bookingId,
      teacherId: timesheets.teacherId,
      totalHours: timesheets.totalHours,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
      date: coverRequests.date,
      roleNeeded: coverRequests.roleNeeded,
    })
    .from(timesheets)
    .innerJoin(bookings, eq(timesheets.bookingId, bookings.id))
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(teachers, eq(timesheets.teacherId, teachers.id))
    .where(and(...conditions))
    .orderBy(coverRequests.date)
    .all();

  if (eligibleTimesheets.length === 0) {
    return NextResponse.json(
      { error: "No approved timesheets found for this school in the selected period" },
      { status: 400 }
    );
  }

  // Create invoice
  const invoiceId = ulid();
  const now = new Date();
  let totalPayAmount = 0;
  let totalChargeAmount = 0;

  // Build line items
  const lineItems: Array<{
    id: string;
    invoiceId: string;
    timesheetId: string;
    description: string;
    hours: number;
    payRate: number;
    chargeRate: number;
    payAmount: number;
    chargeAmount: number;
    createdAt: Date;
  }> = [];

  for (const ts of eligibleTimesheets) {
    const rates = lookupPayRate(ts.roleNeeded, schoolId, ts.date);
    if (!rates) {
      return NextResponse.json(
        {
          error: `No pay rate configured for ${ts.roleNeeded} on ${ts.date}. Please add a pay rate first.`,
        },
        { status: 400 }
      );
    }

    const payAmount = Math.round(ts.totalHours * rates.payRate);
    const chargeAmount = Math.round(ts.totalHours * rates.chargeRate);
    totalPayAmount += payAmount;
    totalChargeAmount += chargeAmount;

    lineItems.push({
      id: ulid(),
      invoiceId,
      timesheetId: ts.timesheetId,
      description: `${ts.teacherFirstName} ${ts.teacherLastName} - ${ts.date} (${ts.roleNeeded})`,
      hours: ts.totalHours,
      payRate: rates.payRate,
      chargeRate: rates.chargeRate,
      payAmount,
      chargeAmount,
      createdAt: now,
    });
  }

  // Insert invoice and line items in a transaction to prevent partial writes
  db.transaction((tx) => {
    tx.insert(invoices)
      .values({
        id: invoiceId,
        schoolId,
        periodStart,
        periodEnd,
        totalPayAmount,
        totalChargeAmount,
        status: "draft",
        createdAt: now,
      })
      .run();

    for (const li of lineItems) {
      tx.insert(invoiceLineItems).values(li).run();
    }
  });

  return NextResponse.json(
    { success: true, id: invoiceId, lineItemCount: lineItems.length },
    { status: 201 }
  );
}
