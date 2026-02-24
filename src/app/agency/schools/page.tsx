import { db } from "@/lib/db";
import { schools, coverRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone } from "lucide-react";
import Link from "next/link";

export default async function AgencySchoolsPage() {
  await requireSession("agent");

  const allSchools = db.select().from(schools).all();
  const allRequests = db.select().from(coverRequests).all();

  const requestCounts = new Map<string, number>();
  allRequests.forEach((r) => {
    requestCounts.set(r.schoolId, (requestCounts.get(r.schoolId) || 0) + 1);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Schools</h1>
        <p className="text-muted-foreground">{allSchools.length} registered schools</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {allSchools.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {s.postcode}
                    </span>
                    <span>{s.contactName}</span>
                    <a href={`tel:${s.contactPhone}`} className="flex items-center gap-1 text-primary hover:underline">
                      <Phone className="h-3 w-3" /> {s.contactPhone}
                    </a>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {requestCounts.get(s.id) || 0} requests
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
