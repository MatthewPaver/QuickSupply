import { db } from "@/lib/db";
import { teachers, complianceDocuments } from "@/lib/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  FileSearch,
} from "lucide-react";
import Link from "next/link";
import { format, addDays, differenceInDays, startOfDay } from "date-fns";

export default async function ComplianceDashboard() {
  await requireSession("agent");

  const allTeachers = db.select().from(teachers).all();
  const compliantTeachers = allTeachers.filter(
    (t) => t.complianceStatus === "compliant"
  );
  const pendingTeachers = allTeachers.filter(
    (t) => t.complianceStatus === "pending"
  );
  const expiredTeachers = allTeachers.filter(
    (t) => t.complianceStatus === "expired"
  );

  // Documents pending verification
  const pendingVerification = db
    .select({ count: sql<number>`count(*)` })
    .from(complianceDocuments)
    .where(eq(complianceDocuments.status, "pending_verification"))
    .get();
  const pendingVerificationCount = Number(pendingVerification?.count ?? 0);

  // Documents expiring within 30 days
  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");
  const in30DaysStr = format(addDays(today, 30), "yyyy-MM-dd");

  const expiringDocs = db
    .select({
      docId: complianceDocuments.id,
      teacherId: complianceDocuments.teacherId,
      documentType: complianceDocuments.documentType,
      expiryDate: complianceDocuments.expiryDate,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
    })
    .from(complianceDocuments)
    .innerJoin(teachers, eq(complianceDocuments.teacherId, teachers.id))
    .where(
      and(
        eq(complianceDocuments.status, "verified"),
        gte(complianceDocuments.expiryDate, todayStr),
        lte(complianceDocuments.expiryDate, in30DaysStr)
      )
    )
    .all();

  // Sort by expiry date ascending (most urgent first)
  expiringDocs.sort((a, b) =>
    (a.expiryDate ?? "").localeCompare(b.expiryDate ?? "")
  );

  return (
    <div className="space-y-6 qs-enter">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-primary/80">
          Compliance Management
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Compliance Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Monitor teacher compliance status, expiring documents, and
          verification queue.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Compliant
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {compliantTeachers.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              teachers fully verified
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {pendingTeachers.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              awaiting compliance
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Expired
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {expiredTeachers.length}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              compliance expired
            </p>
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pending Verification
            </CardTitle>
            <FileSearch className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {pendingVerificationCount}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              documents to review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expiring Soon</CardTitle>
          <Link href="/agency/compliance/documents">
            <Button variant="outline" size="sm">
              Verification Queue
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {expiringDocs.length === 0 ? (
            <EmptyState
              icon="file-text"
              title="No documents expiring soon"
              description="All verified documents are valid for more than 30 days. You will be notified automatically when documents approach their expiry date."
            />
          ) : (
            <div className="space-y-3">
              {expiringDocs.map((doc) => {
                const daysUntilExpiry = differenceInDays(
                  new Date(doc.expiryDate + "T00:00:00"),
                  today
                );
                const isUrgent = daysUntilExpiry <= 7;
                const docLabel = doc.documentType
                  .toUpperCase()
                  .replace("_", " ");

                return (
                  <Link
                    key={doc.docId}
                    href={`/agency/teachers/${doc.teacherId}`}
                  >
                    <div className="flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {doc.teacherFirstName} {doc.teacherLastName}
                          </span>
                          <StatusBadge
                            status={
                              isUrgent
                                ? "expired-compliance"
                                : "pending-compliance"
                            }
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {docLabel} &middot; Expires{" "}
                          {format(
                            new Date(doc.expiryDate + "T00:00:00"),
                            "d MMM yyyy"
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-semibold ${
                            isUrgent ? "text-destructive" : "text-amber-600"
                          }`}
                        >
                          {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}
                        </span>
                        <p className="text-xs text-muted-foreground">
                          until expiry
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teacher Compliance Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="qs-pop">
          <CardHeader>
            <CardTitle className="text-base text-emerald-600">
              Compliant Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compliantTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No compliant teachers yet.
              </p>
            ) : (
              <div className="space-y-2">
                {compliantTeachers.slice(0, 8).map((t) => (
                  <Link key={t.id} href={`/agency/teachers/${t.id}`}>
                    <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                      <span>
                        {t.firstName} {t.lastName}
                      </span>
                      <StatusBadge status="compliant" />
                    </div>
                  </Link>
                ))}
                {compliantTeachers.length > 8 && (
                  <p className="text-xs text-muted-foreground">
                    +{compliantTeachers.length - 8} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader>
            <CardTitle className="text-base text-amber-600">
              Pending Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teachers pending compliance.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingTeachers.slice(0, 8).map((t) => (
                  <Link key={t.id} href={`/agency/teachers/${t.id}`}>
                    <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                      <span>
                        {t.firstName} {t.lastName}
                      </span>
                      <StatusBadge status="pending-compliance" />
                    </div>
                  </Link>
                ))}
                {pendingTeachers.length > 8 && (
                  <p className="text-xs text-muted-foreground">
                    +{pendingTeachers.length - 8} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="qs-pop">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Expired Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expiredTeachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No teachers with expired compliance.
              </p>
            ) : (
              <div className="space-y-2">
                {expiredTeachers.slice(0, 8).map((t) => (
                  <Link key={t.id} href={`/agency/teachers/${t.id}`}>
                    <div className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50">
                      <span>
                        {t.firstName} {t.lastName}
                      </span>
                      <StatusBadge status="expired-compliance" />
                    </div>
                  </Link>
                ))}
                {expiredTeachers.length > 8 && (
                  <p className="text-xs text-muted-foreground">
                    +{expiredTeachers.length - 8} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
