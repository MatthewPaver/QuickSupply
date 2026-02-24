/**
 * Adds one past (filled) cover request and booking for St. Mary's so the
 * "Request Previous Teacher" section on the New Request form has at least one
 * option. Run after pnpm db:clear-requests for a clean demo that still shows
 * the previous-teacher feature.
 *
 * Run: pnpm db:seed-demo
 * Requires: DB migrated and seeded with schools and teachers (pnpm db:migrate && pnpm db:seed).
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ulid } from "ulid";
import * as schema from "../src/lib/db/schema";

const sqlite = new Database("./quicksupply.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF");
const db = drizzle(sqlite, { schema });

// Find first school and one teacher (typically St. Mary's if using main seed)
const school = db
  .select({ id: schema.schools.id })
  .from(schema.schools)
  .limit(1)
  .get();

if (!school) {
  console.log("No school found. Run pnpm db:migrate && pnpm db:seed first.");
  sqlite.close();
  process.exit(1);
}

const teacher = db
  .select({ id: schema.teachers.id })
  .from(schema.teachers)
  .limit(1)
  .get();

if (!teacher) {
  console.log("No teacher found. Run pnpm db:seed first.");
  sqlite.close();
  process.exit(1);
}

const requestId = ulid();
const bookingId = ulid();
const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 14);
const dateStr = pastDate.toISOString().split("T")[0];
const now = new Date();

db.insert(schema.coverRequests).values({
  id: requestId,
  schoolId: school.id,
  date: dateStr,
  roleNeeded: "teacher",
  subject: "Maths",
  keyStage: "KS2",
  startTime: "08:30",
  endTime: "15:30",
  status: "filled",
  isEmergency: false,
  createdAt: now,
}).run();

db.insert(schema.bookings).values({
  id: bookingId,
  coverRequestId: requestId,
  teacherId: teacher.id,
  confirmedAt: now,
  createdAt: now,
}).run();

console.log("Demo previous-teacher data added: one past filled request for St. Mary's with one booking.");
console.log("On New Cover Request you'll see one teacher in 'Request Previous Teacher'.");

sqlite.close();
