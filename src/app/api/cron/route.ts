import { NextResponse } from "next/server";
import { checkExpiredOffers } from "@/lib/assignment-engine";

export async function GET() {
  const expired = checkExpiredOffers();
  return NextResponse.json({ expired });
}
