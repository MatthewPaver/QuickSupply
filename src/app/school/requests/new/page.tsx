import { Suspense } from "react";
import { db } from "@/lib/db";
import { bookings, teachers, coverRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { CoverRequestForm } from "@/components/school/cover-request-form";

export default async function NewRequestPage() {
  const session = await requireSession("school");

  // Get teachers who have previously worked at this school
  const previousTeachers = db
    .select({
      id: teachers.id,
      firstName: teachers.firstName,
      lastName: teachers.lastName,
      roleType: teachers.roleType,
    })
    .from(bookings)
    .innerJoin(coverRequests, eq(bookings.coverRequestId, coverRequests.id))
    .innerJoin(teachers, eq(bookings.teacherId, teachers.id))
    .where(eq(coverRequests.schoolId, session.userId))
    .groupBy(teachers.id)
    .all();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Cover Request</h1>
        <p className="text-muted-foreground">Tell the agency the day, role and times you need covered.</p>
      </div>
      <Suspense>
        <CoverRequestForm
          schoolId={session.userId}
          previousTeachers={previousTeachers}
        />
      </Suspense>
    </div>
  );
}
