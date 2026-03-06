import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { TeachersFilter } from "@/components/agency/teachers-filter";

export default async function AgencyTeachersPage() {
  await requireSession("agent");

  const allTeachers = db.select().from(teachers).all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teachers & TAs</h1>
        <p className="text-muted-foreground">{allTeachers.length} registered</p>
      </div>

      <TeachersFilter teachers={allTeachers} />
    </div>
  );
}
