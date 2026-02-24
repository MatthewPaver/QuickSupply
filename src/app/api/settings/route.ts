import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  for (const [key, value] of Object.entries(body)) {
    const existing = db.select().from(appConfig).where(eq(appConfig.key, key)).get();
    if (existing) {
      db.update(appConfig).set({ value: String(value) }).where(eq(appConfig.key, key)).run();
    } else {
      db.insert(appConfig).values({ key, value: String(value) }).run();
    }
  }

  return NextResponse.json({ ok: true });
}
