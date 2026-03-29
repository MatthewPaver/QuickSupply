import { db } from "@/lib/db";
import { invoices, schools } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { format } from "date-fns";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { InvoiceGenerator } from "@/components/agency/invoice-generator";

function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

export default async function AgencyInvoicesPage() {
  await requireSession("agent");

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

  // Get all schools for the generator form
  const allSchools = db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .orderBy(schools.name)
    .all();

  return (
    <div className="space-y-6 qs-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            {rows.length} invoice{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <InvoiceGenerator schools={allSchools} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No invoices"
          description="Generate your first invoice by selecting a school and date range."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Charge Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      {inv.schoolName}
                    </TableCell>
                    <TableCell>
                      {format(new Date(inv.periodStart), "d MMM")} &ndash;{" "}
                      {format(new Date(inv.periodEnd), "d MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      &pound;{penceToPounds(inv.totalChargeAmount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={inv.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/agency/invoices/${inv.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
