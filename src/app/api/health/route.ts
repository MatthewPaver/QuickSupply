import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";

export async function GET() {
  try {
    db.select().from(appConfig).limit(1).get();

    return NextResponse.json(
      { status: "ok", timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "error", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}

export const dynamic = "force-dynamic";
