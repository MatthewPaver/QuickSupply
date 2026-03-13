import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth";
import { TeachersFilter } from "@/components/agency/teachers-filter";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AgencyTeachersPage() {
  await requireSession("agent");

  const allTeachers = db.select().from(teachers).all();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Teachers & TAs</h1>
          <p className="text-muted-foreground">{allTeachers.length} registered</p>
        </div>
        <Link href="/agency/teachers/new">
          <Button>New Teacher</Button>
        </Link>
      </div>

      <TeachersFilter teachers={allTeachers} />
    </div>
  );
}
