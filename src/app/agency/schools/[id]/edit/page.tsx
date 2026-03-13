import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import { SchoolForm } from "@/components/agency/school-form";

export default async function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession("agent");
  const { id } = await params;
  const school = db.select().from(schools).where(eq(schools.id, id)).get();
  if (!school) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit School</h1>
        <p className="text-muted-foreground">{school.name}</p>
      </div>
      <SchoolForm
        mode="edit"
        schoolId={id}
        initialData={{
          name: school.name,
          address: school.address,
          postcode: school.postcode,
          phase: school.phase,
          contactName: school.contactName,
          contactEmail: school.contactEmail,
          contactPhone: school.contactPhone,
        }}
      />
    </div>
  );
}
