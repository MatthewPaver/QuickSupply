import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { TeacherRow } from "@/components/agency/teacher-row";

export default async function AgencyTeachersPage() {
  await requireSession("agent");

  const allTeachers = db.select().from(teachers).all();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Teachers & TAs</h1>
        <p className="text-muted-foreground">{allTeachers.length} registered</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {allTeachers.map((t) => (
              <TeacherRow key={t.id} t={t} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
