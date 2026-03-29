import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, invoiceLineItems, schools } from "@/lib/db/schema";
import { validateBody } from "@/lib/api-validation";

const updateInvoiceStatusSchema = z.object({
  status: z.enum(["sent", "paid"], { message: "Status must be 'sent' or 'paid'" }),
});

/** GET: Single invoice with line items. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const invoice = db
    .select({
      id: invoices.id,
      schoolId: invoices.schoolId,
      schoolName: schools.name,
      schoolAddress: schools.address,
      schoolPostcode: schools.postcode,
      periodStart: invoices.periodStart,
      periodEnd: invoices.periodEnd,
      totalPayAmount: invoices.totalPayAmount,
      totalChargeAmount: invoices.totalChargeAmount,
      status: invoices.status,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .innerJoin(schools, eq(invoices.schoolId, schools.id))
    .where(eq(invoices.id, id))
    .get();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const items = db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .all();

  return NextResponse.json({ success: true, invoice, lineItems: items });
}

/** PATCH: Update invoice status (draft -> sent -> paid). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const invoice = db
    .select({ id: invoices.id, status: invoices.status })
    .from(invoices)
    .where(eq(invoices.id, id))
    .get();

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const parsed = await validateBody(request, updateInvoiceStatusSchema);
  if (!parsed.success) return parsed.response;

  const { status: newStatus } = parsed.data;

  // Validate transitions: draft -> sent -> paid
  const validTransitions: Record<string, string[]> = {
    draft: ["sent"],
    sent: ["paid"],
    paid: [],
  };

  const allowed = validTransitions[invoice.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Cannot transition from '${invoice.status}' to '${newStatus}'` },
      { status: 400 }
    );
  }

  db.update(invoices)
    .set({ status: newStatus })
    .where(eq(invoices.id, id))
    .run();

  return NextResponse.json({ success: true });
}
