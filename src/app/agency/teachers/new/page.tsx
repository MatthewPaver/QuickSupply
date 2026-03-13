import { requireSession } from "@/lib/auth";
import { TeacherForm } from "@/components/agency/teacher-form";

export default async function NewTeacherPage() {
  await requireSession("agent");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Teacher</h1>
        <p className="text-muted-foreground">Add a new teacher or TA to the platform</p>
      </div>
      <TeacherForm mode="create" />
    </div>
  );
}
