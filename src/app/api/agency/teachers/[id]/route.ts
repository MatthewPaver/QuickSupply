import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencyUpdateTeacherSchema } from "@/lib/api-validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = db.select({ id: teachers.id }).from(teachers).where(eq(teachers.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const parsed = await validateBody(request, agencyUpdateTeacherSchema);
  if (!parsed.success) return parsed.response;

  const updates: Record<string, unknown> = { ...parsed.data };

  // Geocode if postcode changed
  if (parsed.data.postcode) {
    const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(parsed.data.postcode.replace(/\s+/g, ""))}`);
    const geo = await geoRes.json();
    if (geo.status !== 200 || !geo.result) {
      return NextResponse.json({ error: "Invalid or unrecognised postcode", fieldErrors: { postcode: ["Invalid or unrecognised postcode"] } }, { status: 400 });
    }
    updates.lat = geo.result.latitude;
    updates.lng = geo.result.longitude;
    updates.postcode = parsed.data.postcode.toUpperCase();
  }

  db.update(teachers).set(updates).where(eq(teachers.id, id)).run();
  return NextResponse.json({ ok: true });
}
