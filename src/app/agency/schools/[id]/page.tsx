import { db } from "@/lib/db";
import { schools, coverRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, User } from "lucide-react";
import { SchoolCredentialsForm } from "@/components/agency/school-credentials-form";
import { SchoolStatusToggle } from "@/components/agency/school-status-toggle";

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession("agent");
  const { id } = await params;
  const school = db.select().from(schools).where(eq(schools.id, id)).get();
  if (!school) notFound();

  const requestCount = db.select({ id: coverRequests.id }).from(coverRequests).where(eq(coverRequests.schoolId, id)).all().length;

  return (
    <div className="space-y-6">
      {!school.isActive && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          This school is deactivated. The school contact cannot sign in or submit cover requests.
        </div>
      )}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{school.name}</h1>
          <p className="text-muted-foreground capitalize">{school.phase} school</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/agency/schools/${id}/edit`}>
            <Button variant="outline" size="sm">Edit School</Button>
          </Link>
          <SchoolStatusToggle schoolId={id} isActive={school.isActive} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>School Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{school.address}</p>
            <p className="text-muted-foreground">Postcode: {school.postcode}</p>
            <p className="text-muted-foreground">Phase: {school.phase}</p>
            <p className="text-muted-foreground">Cover requests: {requestCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{school.contactName}</p>
            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{school.contactEmail}</p>
            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{school.contactPhone}</p>
          </CardContent>
        </Card>
      </div>

      <SchoolCredentialsForm schoolId={id} currentEmail={school.contactEmail} />
    </div>
  );
}
