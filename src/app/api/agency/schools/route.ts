import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencyCreateSchoolSchema } from "@/lib/api-validation";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const BCRYPT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, agencyCreateSchoolSchema);
  if (!parsed.success) return parsed.response;

  const { name, address, postcode, phase, contactName, contactEmail, contactPhone, temporaryPassword } = parsed.data;

  // Geocode postcode via postcodes.io (free, no API key required)
  const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s+/g, ""))}`);
  const geo = await geoRes.json();
  if (geo.status !== 200 || !geo.result) {
    return NextResponse.json(
      { error: "Invalid postcode", fieldErrors: { postcode: ["Invalid or unrecognised postcode"] } },
      { status: 400 }
    );
  }
  const lat = geo.result.latitude as number;
  const lng = geo.result.longitude as number;

  // Check for duplicate contactEmail
  const existing = db.select({ id: schools.id }).from(schools).where(eq(schools.contactEmail, contactEmail)).get();
  if (existing) {
    return NextResponse.json(
      { error: "Validation failed", fieldErrors: { contactEmail: ["A school with this contact email already exists"] } },
      { status: 400 }
    );
  }

  const passwordHash = bcrypt.hashSync(temporaryPassword, BCRYPT_ROUNDS);
  const id = randomUUID();

  db.insert(schools).values({
    id,
    name,
    address,
    postcode: postcode.toUpperCase(),
    lat,
    lng,
    phase,
    contactName,
    contactEmail,
    contactPhone,
    passwordHash,
    createdAt: new Date(),
  }).run();

  return NextResponse.json({ id }, { status: 201 });
}
