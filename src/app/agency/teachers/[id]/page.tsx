import { db } from "@/lib/db";
import { teachers, teacherAvailability, teacherBlacklistedSchools, bookings, coverRequests, schools, agentTeacherAssignments, agents, schoolTeacherReviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { Star, Car, MapPin, Phone, Mail, Ban } from "lucide-react";
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
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
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
                <Star className="h-4 w-4 text-blue-500" />
                <span>School reviews: {avgRating.toFixed(1)} / 5.0 ({reviews.length} reviews)</span>
              </div>
            )}
            {teacher.emergencyAvailable && (
              <Badge variant="outline" className="border-red-300 text-red-700">Emergency Available</Badge>
            )}
            {teacher.contactNightBeforeOnly && (
              <Badge variant="outline" className="border-amber-300 text-amber-700">Night Before Only</Badge>
            )}
            {teacher.longTermWilling && (
              <Badge variant="outline" className="border-blue-300 text-blue-700">Long-term Willing</Badge>
            )}
            {teacher.complianceNotes && (
              <div className="border-t pt-3">
                <span className="text-muted-foreground">Compliance Notes:</span>
                <p className="mt-1">{teacher.complianceNotes}</p>
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
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
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

        {blacklisted.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ban className="h-4 w-4 text-red-500" /> Blacklisted Schools
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
                        <Badge variant="outline" className="ml-2 border-green-300 text-green-700 text-xs">
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
