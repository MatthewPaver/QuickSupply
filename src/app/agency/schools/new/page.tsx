import { requireSession } from "@/lib/auth";
import { SchoolForm } from "@/components/agency/school-form";

export default async function NewSchoolPage() {
  await requireSession("agent");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New School</h1>
        <p className="text-muted-foreground">Add a new school to the platform</p>
      </div>
      <SchoolForm mode="create" />
    </div>
  );
}
