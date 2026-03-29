import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { invoices, invoiceLineItems, schools } from "@/lib/db/schema";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePdfDocument } from "@/lib/invoice-pdf";
import type { InvoicePdfData } from "@/lib/invoice-pdf";

const paramsSchema = z.object({
  id: z.string().min(1),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawParams = await params;
  const parsed = paramsSchema.safeParse(rawParams);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid invoice ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = parsed.data;

  const invoice = db
    .select({
      id: invoices.id,
      schoolId: invoices.schoolId,
      schoolName: schools.name,
      schoolAddress: schools.address,
      schoolPostcode: schools.postcode,
      schoolContactName: schools.contactName,
      schoolContactEmail: schools.contactEmail,
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
    return new Response(JSON.stringify({ error: "Invoice not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const items = db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .all();

  const pdfData: InvoicePdfData = {
    id: invoice.id,
    schoolName: invoice.schoolName,
    schoolAddress: invoice.schoolAddress,
    schoolPostcode: invoice.schoolPostcode,
    schoolContactName: invoice.schoolContactName,
    schoolContactEmail: invoice.schoolContactEmail,
    periodStart: invoice.periodStart,
    periodEnd: invoice.periodEnd,
    totalPayAmount: invoice.totalPayAmount,
    totalChargeAmount: invoice.totalChargeAmount,
    status: invoice.status,
    createdAt: invoice.createdAt,
    lineItems: items.map((item) => ({
      id: item.id,
      description: item.description,
      hours: item.hours,
      payRate: item.payRate,
      chargeRate: item.chargeRate,
      payAmount: item.payAmount,
      chargeAmount: item.chargeAmount,
    })),
  };

  const buffer = await renderToBuffer(
    InvoicePdfDocument({ data: pdfData })
  );

  return new Response(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
