import { db } from "@/lib/db";
import { invoices, invoiceLineItems, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { InvoiceStatusActions } from "@/components/agency/invoice-status-actions";
import { ArrowLeft, Download } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  await requireSession("agent");

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
    notFound();
  }

  const items = db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id))
    .all();

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <Link
          href="/agency/invoices"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none rounded-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Invoices
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Invoice</h1>
            <p className="text-muted-foreground">
              {invoice.schoolName} &mdash;{" "}
              {format(new Date(invoice.periodStart), "d MMM")} &ndash;{" "}
              {format(new Date(invoice.periodEnd), "d MMM yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={invoice.status} />
            <a
              href={`/api/agency/invoices/${invoice.id}/pdf`}
              download
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Download className="mr-1.5 h-4 w-4" />
              Download PDF
            </a>
            {invoice.status !== "paid" && (
              <InvoiceStatusActions
                invoiceId={invoice.id}
                currentStatus={invoice.status}
              />
            )}
          </div>
        </div>
      </div>

      {/* School info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">School Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">School</dt>
              <dd className="font-medium">{invoice.schoolName}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd className="font-medium">
                {invoice.schoolAddress}, {invoice.schoolPostcode}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Period</dt>
              <dd className="font-medium">
                {format(new Date(invoice.periodStart), "d MMM yyyy")} &ndash;{" "}
                {format(new Date(invoice.periodEnd), "d MMM yyyy")}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {format(invoice.createdAt, "d MMM yyyy HH:mm")}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Line items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Line Items ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Pay Rate</TableHead>
                <TableHead className="text-right">Charge Rate</TableHead>
                <TableHead className="text-right">Pay Amount</TableHead>
                <TableHead className="text-right">Charge Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">
                    {item.hours.toFixed(1)}
                  </TableCell>
                  <TableCell className="text-right">
                    &pound;{penceToPounds(item.payRate)}/hr
                  </TableCell>
                  <TableCell className="text-right">
                    &pound;{penceToPounds(item.chargeRate)}/hr
                  </TableCell>
                  <TableCell className="text-right">
                    &pound;{penceToPounds(item.payAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    &pound;{penceToPounds(item.chargeAmount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-8">
                <dt className="text-muted-foreground">Total Pay Amount</dt>
                <dd className="font-medium">
                  &pound;{penceToPounds(invoice.totalPayAmount)}
                </dd>
              </div>
              <div className="flex justify-between gap-8 border-t pt-2">
                <dt className="font-semibold">Total Charge Amount</dt>
                <dd className="font-bold text-lg">
                  &pound;{penceToPounds(invoice.totalChargeAmount)}
                </dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
