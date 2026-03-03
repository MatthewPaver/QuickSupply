import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

/** Allowed config keys and their validation. Unknown keys are rejected. */
const ALLOWED_KEYS: Record<string, { min: number; max: number }> = {
  morning_response_window_minutes: { min: 1, max: 120 },
  next_day_response_window_minutes: { min: 15, max: 1440 },
};

const MAX_VALUE_LENGTH = 256;

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings: Record<string, string> = {};
  for (const key of Object.keys(ALLOWED_KEYS)) {
    const row = db.select().from(appConfig).where(eq(appConfig.key, key)).get();
    settings[key] = row?.value ?? "";
  }
  return NextResponse.json(settings);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be a JSON object" }, { status: 400 });
  }

  for (const [key, value] of Object.entries(body)) {
    const schema = ALLOWED_KEYS[key];
    if (!schema) {
      return NextResponse.json({ error: `Unknown setting key: ${key}` }, { status: 400 });
    }
    const str = String(value);
    if (str.length > MAX_VALUE_LENGTH) {
      return NextResponse.json({ error: `Value for ${key} exceeds max length` }, { status: 400 });
    }
    const num = parseInt(str, 10);
    if (Number.isNaN(num) || num < schema.min || num > schema.max) {
      return NextResponse.json(
        { error: `Value for ${key} must be a number between ${schema.min} and ${schema.max}` },
        { status: 400 }
      );
    }
    const existing = db.select().from(appConfig).where(eq(appConfig.key, key)).get();
    if (existing) {
      db.update(appConfig).set({ value: str }).where(eq(appConfig.key, key)).run();
    } else {
      db.insert(appConfig).values({ key, value: str }).run();
    }
  }

  return NextResponse.json({ ok: true });
}
