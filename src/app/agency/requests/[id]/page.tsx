import { db } from "@/lib/db";
import { coverRequests, schools, assignmentOffers, teachers, bookings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { AssignmentPanel } from "@/components/agency/assignment-panel";

export default async function AgencyRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession("agent");
  const { id } = await params;

  const request = db.select().from(coverRequests).where(eq(coverRequests.id, id)).get();
  if (!request) notFound();

  const school = db.select().from(schools).where(eq(schools.id, request.schoolId)).get();

  // Get offer history
  const offers = db
    .select({
      id: assignmentOffers.id,
      teacherId: assignmentOffers.teacherId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
      teacherPhone: teachers.phone,
      status: assignmentOffers.status,
      offerOrder: assignmentOffers.offerOrder,
      offeredAt: assignmentOffers.offeredAt,
      expiresAt: assignmentOffers.expiresAt,
      responseAt: assignmentOffers.responseAt,
    })
    .from(assignmentOffers)
    .innerJoin(teachers, eq(assignmentOffers.teacherId, teachers.id))
    .where(eq(assignmentOffers.coverRequestId, id))
    .orderBy(assignmentOffers.offerOrder)
    .all();

  // Get booking if filled
  const booking = db
    .select({
      id: bookings.id,
      teacherId: bookings.teacherId,
      teacherFirstName: teachers.firstName,
      teacherLastName: teachers.lastName,
      teacherPhone: teachers.phone,
      confirmedAt: bookings.confirmedAt,
      cancelledAt: bookings.cancelledAt,
    })
    .from(bookings)
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .where(eq(bookings.coverRequestId, id))
    .get();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{school?.name || "Unknown School"}</h1>
        <StatusBadge status={request.status} />
        {request.isEmergency && <Badge variant="destructive">EMERGENCY</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Details */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(new Date(request.date), "EEE, d MMM yyyy")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{request.roleNeeded}</span>
              </div>
              {request.subject && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subject</span>
                  <span className="font-medium">{request.subject}</span>
                </div>
              )}
              {request.keyStage && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Year group</span>
                  <span className="font-medium">{request.keyStage}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{request.startTime} - {request.endTime}</span>
              </div>
              {request.notes && (
                <div className="border-t pt-3">
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{request.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Offer History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Offer History</CardTitle>
            </CardHeader>
            <CardContent>
              {offers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No offers made yet.</p>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between rounded border p-3">
                      <div>
                        <div className="text-sm font-medium">
                          #{offer.offerOrder} {offer.teacherFirstName} {offer.teacherLastName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {offer.offeredAt && format(new Date(offer.offeredAt), "HH:mm")}
                          {offer.responseAt && ` → ${format(new Date(offer.responseAt), "HH:mm")}`}
                        </div>
                      </div>
                      <StatusBadge status={offer.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Booking */}
          {booking && !booking.cancelledAt && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Current Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teacher</span>
                    <span className="font-medium">{booking.teacherFirstName} {booking.teacherLastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <a href={`tel:${booking.teacherPhone}`} className="font-medium text-primary hover:underline">
                      {booking.teacherPhone}
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmed</span>
                    <span>{booking.confirmedAt && format(new Date(booking.confirmedAt), "d MMM HH:mm")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Assignment Panel */}
        <div className="lg:col-span-2">
          <AssignmentPanel
            requestId={id}
            requestStatus={request.status}
            bookingId={booking?.id || null}
            hasActiveOffer={offers.some((o) => o.status === "pending")}
          />
        </div>
      </div>
    </div>
  );
}
