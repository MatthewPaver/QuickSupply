import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, agencyCreateTeacherSchema } from "@/lib/api-validation";
import * as bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

const BCRYPT_ROUNDS = 10;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, agencyCreateTeacherSchema);
  if (!parsed.success) return parsed.response;

  const {
    firstName, lastName, email, phone, postcode, roleType,
    canDrive, maxDistanceMiles, emergencyAvailable,
    contactNightBeforeOnly, longTermWilling, temporaryPassword,
  } = parsed.data;

  // Geocode postcode via postcodes.io (free, no API key required)
  const geoRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s+/g, ""))}`);
  const geo = await geoRes.json();
  if (geo.status !== 200 || !geo.result) {
    return NextResponse.json({ error: "Invalid or unrecognised postcode", fieldErrors: { postcode: ["Invalid or unrecognised postcode"] } }, { status: 400 });
  }
  const lat = geo.result.latitude as number;
  const lng = geo.result.longitude as number;

  // Check for duplicate email
  const existing = db.select({ id: teachers.id }).from(teachers).where(eq(teachers.email, email)).get();
  if (existing) {
    return NextResponse.json({ error: "Validation failed", fieldErrors: { email: ["A teacher with this email already exists"] } }, { status: 400 });
  }

  const passwordHash = bcrypt.hashSync(temporaryPassword, BCRYPT_ROUNDS);
  const id = randomUUID();

  db.insert(teachers).values({
    id,
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    postcode: postcode.toUpperCase(),
    lat,
    lng,
    canDrive,
    maxDistanceMiles,
    roleType,
    emergencyAvailable,
    contactNightBeforeOnly,
    longTermWilling,
    agencyRating: 3.0,
    complianceStatus: "pending",
    createdAt: new Date(),
  }).run();

  return NextResponse.json({ id }, { status: 201 });
}
