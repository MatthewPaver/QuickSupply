import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateBody, rankingWeightsSchema } from "@/lib/api-validation";

const DEFAULT_WEIGHTS = {
  preferred: 200,
  rating: 20,
  review: 10,
  distance: 30,
  drive: 25,
  familiarity: 15,
  subjectMatch: 30,
};

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = db
    .select()
    .from(appConfig)
    .where(eq(appConfig.key, "ranking_weights"))
    .get();

  if (row) {
    try {
      const weights = JSON.parse(row.value);
      return NextResponse.json({ weights });
    } catch {
      return NextResponse.json({ weights: DEFAULT_WEIGHTS });
    }
  }

  return NextResponse.json({ weights: DEFAULT_WEIGHTS });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = await validateBody(request, rankingWeightsSchema);
  if (!parsed.success) return parsed.response;

  const existing = db
    .select()
    .from(appConfig)
    .where(eq(appConfig.key, "ranking_weights"))
    .get();

  if (existing) {
    db.update(appConfig)
      .set({ value: JSON.stringify(parsed.data) })
      .where(eq(appConfig.key, "ranking_weights"))
      .run();
  } else {
    db.insert(appConfig)
      .values({ key: "ranking_weights", value: JSON.stringify(parsed.data) })
      .run();
  }

  return NextResponse.json({ success: true, weights: parsed.data });
}
