import { db } from "@/lib/db";
import { teachers, teacherAvailability, teacherBlacklistedSchools, bookings, coverRequests, schools, agentTeacherAssignments, agents, schoolTeacherReviews, teacherSubjects, assignmentOffers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Star, Car, MapPin, Phone, Mail, Ban, BookOpen, TrendingUp, Building2 } from "lucide-react";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import { TeacherComplianceForm } from "@/components/agency/teacher-compliance-form";
import { TeacherCredentialsForm } from "@/components/agency/teacher-credentials-form";
import { TeacherStatusToggle } from "@/components/agency/teacher-status-toggle";

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AgencyTeacherDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession("agent");
  const { id } = await params;

  const teacher = db.select().from(teachers).where(eq(teachers.id, id)).get();
  if (!teacher) notFound();

  const availability = db.select().from(teacherAvailability).where(eq(teacherAvailability.teacherId, id)).all();
  const blacklisted = db
    .select({ schoolId: teacherBlacklistedSchools.schoolId, schoolName: schools.name, reason: teacherBlacklistedSchools.reason })
    .from(teacherBlacklistedSchools)
    .innerJoin(schools, eq(teacherBlacklistedSchools.schoolId, schools.id))
    .where(eq(teacherBlacklistedSchools.teacherId, id))
    .all();

  const teacherBookings = db
    .select({
      date: coverRequests.date,
      schoolName: schools.name,
      roleNeeded: coverRequests.roleNeeded,
      subject: coverRequests.subject,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(schools, eq(coverRequests.schoolId, schools.id))
    .where(eq(bookings.teacherId, id))
    .all();

  const reviews = db.select().from(schoolTeacherReviews).where(eq(schoolTeacherReviews.teacherId, id)).all();
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : null;

  // Subject specializations
  const subjects = db
    .select({ subject: teacherSubjects.subject })
    .from(teacherSubjects)
    .where(eq(teacherSubjects.teacherId, id))
    .all()
    .map((s) => s.subject);

  // School affinity data — group reviews by school
  const reviewsWithSchools = db
    .select({
      schoolId: schoolTeacherReviews.schoolId,
      schoolName: schools.name,
      rating: schoolTeacherReviews.rating,
      wouldRebook: schoolTeacherReviews.wouldRebook,
    })
    .from(schoolTeacherReviews)
    .innerJoin(schools, eq(schoolTeacherReviews.schoolId, schools.id))
    .where(eq(schoolTeacherReviews.teacherId, id))
    .all();

  const schoolAffinityMap = new Map<string, { schoolName: string; ratings: number[]; rebooks: boolean[] }>();
  for (const r of reviewsWithSchools) {
    const entry = schoolAffinityMap.get(r.schoolId) ?? { schoolName: r.schoolName, ratings: [], rebooks: [] };
    entry.ratings.push(r.rating);
    entry.rebooks.push(r.wouldRebook);
    schoolAffinityMap.set(r.schoolId, entry);
  }

  const schoolAffinities = Array.from(schoolAffinityMap.entries()).map(([schoolId, data]) => {
    const avgRat = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length;
    const rebookRate = data.rebooks.filter(Boolean).length / data.rebooks.length;
    const affinity = (avgRat / 5) * 0.7 + rebookRate * 0.3;
    return {
      schoolId,
      schoolName: data.schoolName,
      avgRating: avgRat,
      rebookPct: rebookRate * 100,
      affinityScore: affinity,
      reviewCount: data.ratings.length,
    };
  }).sort((a, b) => b.affinityScore - a.affinityScore);

  // Performance metrics
  const allOffers = db
    .select({ status: assignmentOffers.status })
    .from(assignmentOffers)
    .where(eq(assignmentOffers.teacherId, id))
    .all();

  const acceptedOffers = allOffers.filter((o) => o.status === "accepted").length;
  const declinedOffers = allOffers.filter((o) => o.status === "declined").length;
  const totalResponded = acceptedOffers + declinedOffers;
  const acceptanceRate = totalResponded > 0 ? (acceptedOffers / totalResponded) * 100 : null;

  const allBookings = db
    .select({ cancelledAt: bookings.cancelledAt })
    .from(bookings)
    .where(eq(bookings.teacherId, id))
    .all();

  const totalBookings = allBookings.length;
  const cancelledBookings = allBookings.filter((b) => b.cancelledAt !== null).length;
  const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : null;

  const assignedAgent = db
    .select({ agentName: agents.name })
    .from(agentTeacherAssignments)
    .innerJoin(agents, eq(agentTeacherAssignments.agentId, agents.id))
    .where(eq(agentTeacherAssignments.teacherId, id))
    .get();

  const recurringAvail = availability.filter((a) => a.isRecurring);

  return (
    <div className="space-y-6">
      {!teacher.isActive && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          This teacher is deactivated and cannot sign in or receive assignments.
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
          {teacher.firstName[0]}{teacher.lastName[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{teacher.firstName} {teacher.lastName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="capitalize">{teacher.roleType}</span>
            <StatusBadge status={teacher.complianceStatus === "compliant" ? "compliant" : teacher.complianceStatus === "pending" ? "pending-compliance" : "expired-compliance"} />
            {assignedAgent && <span>Agent: {assignedAgent.agentName}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agency/teachers/${id}/edit`}>
            <Button variant="outline" size="sm">Edit Profile</Button>
          </Link>
          <TeacherStatusToggle teacherId={id} isActive={teacher.isActive} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contact & Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${teacher.phone}`} className="text-primary hover:underline">{teacher.phone}</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{teacher.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{teacher.postcode} &middot; Max {teacher.maxDistanceMiles}mi</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>{teacher.canDrive ? "Can drive" : "No car"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <span>Agency rating: {teacher.agencyRating.toFixed(1)} / 5.0</span>
            </div>
            {avgRating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-secondary" />
                <span>School reviews: {avgRating.toFixed(1)} / 5.0 ({reviews.length} reviews)</span>
              </div>
            )}
            {teacher.emergencyAvailable && (
              <Badge variant="outline" className="border-destructive/30 text-destructive">Emergency Available</Badge>
            )}
            {teacher.contactNightBeforeOnly && (
              <Badge variant="outline" className="border-amber-300 text-amber-700">Night Before Only</Badge>
            )}
            {teacher.longTermWilling && (
              <Badge variant="outline" className="border-secondary/30 text-secondary">Long-term Willing</Badge>
            )}
            {teacher.complianceNotes && (
              <div className="border-t pt-3">
                <span className="text-muted-foreground">Compliance Notes:</span>
                <p className="mt-1">{teacher.complianceNotes}</p>
              </div>
            )}
            {subjects.length > 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Subject Specializations</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {subjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Weekly Availability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {dayNames.map((day, idx) => {
                const avail = recurringAvail.find((a) => a.dayOfWeek === idx);
                const isAvailable = avail ? avail.isAvailable : (idx >= 1 && idx <= 5);
                return (
                  <div
                    key={day}
                    className={`flex h-12 w-12 items-center justify-center rounded-lg text-xs font-medium ${
                      idx === 0 || idx === 6
                        ? "bg-gray-100 text-gray-400"
                        : isAvailable
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <TeacherComplianceForm
          teacherId={id}
          initialCompliance={{
            dbsStatus: teacher.dbsStatus,
            dbsExpiry: teacher.dbsExpiry ?? null,
            rightToWork: teacher.rightToWork,
            complianceStatus: teacher.complianceStatus,
            complianceNotes: teacher.complianceNotes ?? null,
          }}
        />

        <TeacherCredentialsForm
          teacherId={id}
          currentEmail={teacher.email}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Acceptance Rate</span>
              <span className="font-medium">
                {acceptanceRate !== null
                  ? `${acceptanceRate.toFixed(0)}% (${acceptedOffers}/${totalResponded})`
                  : "No offers yet"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancellation Rate</span>
              <span className="font-medium">
                {cancellationRate !== null
                  ? `${cancellationRate.toFixed(0)}% (${cancelledBookings}/${totalBookings})`
                  : "No bookings yet"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Bookings</span>
              <span className="font-medium">{totalBookings}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Offers Received</span>
              <span className="font-medium">{allOffers.length}</span>
            </div>
          </CardContent>
        </Card>

        {schoolAffinities.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> School Affinity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schoolAffinities.map((sa) => (
                  <div key={sa.schoolId} className="rounded border p-3 text-sm space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{sa.schoolName}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          sa.affinityScore >= 0.7
                            ? "border-emerald-300 text-emerald-700"
                            : sa.affinityScore >= 0.4
                            ? "border-amber-300 text-amber-700"
                            : "border-destructive/30 text-destructive"
                        }`}
                      >
                        Affinity: {(sa.affinityScore * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Avg Rating: {sa.avgRating.toFixed(1)}/5</span>
                      <span>Rebook: {sa.rebookPct.toFixed(0)}%</span>
                      <span>{sa.reviewCount} review{sa.reviewCount !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {blacklisted.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ban className="h-4 w-4 text-destructive" /> Blacklisted Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {blacklisted.map((b) => (
                  <div key={b.schoolId} className="flex justify-between rounded border p-2 text-sm">
                    <span>{b.schoolName}</span>
                    {b.reason && <span className="text-xs text-muted-foreground">{b.reason}</span>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {teacherBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No booking history.</p>
            ) : (
              <div className="space-y-2">
                {teacherBookings.map((b) => (
                  <div key={`${b.date}-${b.schoolName}`} className="flex justify-between rounded border p-2 text-sm">
                    <span>{b.schoolName}</span>
                    <span className="text-muted-foreground">
                      {format(new Date(b.date + "T00:00:00"), "d MMM")} &middot; {b.roleNeeded}{b.subject ? ` (${b.subject})` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {reviews.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">School Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded border p-3 text-sm space-y-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                        />
                      ))}
                      {review.wouldRebook && (
                        <Badge variant="outline" className="ml-2 border-emerald-300 text-emerald-700 text-xs">
                          Would rebook
                        </Badge>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-muted-foreground">{review.comment}</p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(review.createdAt), "d MMM yyyy")}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
