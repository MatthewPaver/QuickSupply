import { db } from "@/lib/db";
import { payRates, schools } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
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
import { EmptyState } from "@/components/shared/empty-state";
import { PayRateForm } from "@/components/agency/pay-rate-form";
import { ArrowLeft } from "lucide-react";

function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

export default async function PayRatesPage() {
  await requireSession("agent");

  // Fetch rates with school names
  const withSchool = db
    .select({
      id: payRates.id,
      roleType: payRates.roleType,
      schoolId: payRates.schoolId,
      schoolName: schools.name,
      payRate: payRates.payRate,
      chargeRate: payRates.chargeRate,
      effectiveFrom: payRates.effectiveFrom,
    })
    .from(payRates)
    .innerJoin(schools, eq(payRates.schoolId, schools.id))
    .orderBy(payRates.roleType, desc(payRates.effectiveFrom))
    .all();

  const defaults = db
    .select({
      id: payRates.id,
      roleType: payRates.roleType,
      schoolId: payRates.schoolId,
      payRate: payRates.payRate,
      chargeRate: payRates.chargeRate,
      effectiveFrom: payRates.effectiveFrom,
    })
    .from(payRates)
    .where(isNull(payRates.schoolId))
    .orderBy(payRates.roleType, desc(payRates.effectiveFrom))
    .all();

  const allRates = [
    ...withSchool,
    ...defaults.map((d) => ({ ...d, schoolName: null as string | null })),
  ].sort((a, b) => {
    if (a.roleType < b.roleType) return -1;
    if (a.roleType > b.roleType) return 1;
    return b.effectiveFrom.localeCompare(a.effectiveFrom);
  });

  // Get all schools for the form
  const allSchools = db
    .select({ id: schools.id, name: schools.name })
    .from(schools)
    .orderBy(schools.name)
    .all();

  return (
    <div className="space-y-6 qs-enter">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/agency/settings"
            className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none rounded-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Settings
          </Link>
          <h1 className="text-2xl font-bold">Pay Rates</h1>
          <p className="text-muted-foreground">
            {allRates.length} rate{allRates.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <PayRateForm schools={allSchools} />
      </div>

      {allRates.length === 0 ? (
        <EmptyState
          icon="file-text"
          title="No pay rates"
          description="Add your first pay rate to get started with invoicing."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Type</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Pay Rate</TableHead>
                  <TableHead>Charge Rate</TableHead>
                  <TableHead>Effective From</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="capitalize font-medium">
                      {rate.roleType === "ta" ? "Teaching Assistant" : "Teacher"}
                    </TableCell>
                    <TableCell>
                      {rate.schoolName ?? (
                        <span className="text-muted-foreground">Default</span>
                      )}
                    </TableCell>
                    <TableCell>&pound;{penceToPounds(rate.payRate)}</TableCell>
                    <TableCell>&pound;{penceToPounds(rate.chargeRate)}</TableCell>
                    <TableCell>
                      {format(new Date(rate.effectiveFrom), "d MMM yyyy")}
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
