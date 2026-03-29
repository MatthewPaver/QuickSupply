import { db } from "@/lib/db";
import { teachers, teacherSubjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { TeacherForm } from "@/components/agency/teacher-form";

export default async function EditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession("agent");
  const { id } = await params;
  const teacher = db.select().from(teachers).where(eq(teachers.id, id)).get();
  if (!teacher) notFound();

  const subjects = db
    .select({ subject: teacherSubjects.subject })
    .from(teacherSubjects)
    .where(eq(teacherSubjects.teacherId, id))
    .all()
    .map((s) => s.subject);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Teacher</h1>
        <p className="text-muted-foreground">
          {teacher.firstName} {teacher.lastName}
        </p>
      </div>
      <TeacherForm
        mode="edit"
        teacherId={id}
        initialSubjects={subjects}
        initialData={{
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          postcode: teacher.postcode,
          roleType: teacher.roleType,
          canDrive: teacher.canDrive,
          maxDistanceMiles: teacher.maxDistanceMiles,
          emergencyAvailable: teacher.emergencyAvailable,
          contactNightBeforeOnly: teacher.contactNightBeforeOnly,
          longTermWilling: teacher.longTermWilling,
        }}
      />
    </div>
  );
}
