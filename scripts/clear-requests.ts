/**
 * Clears all cover requests and related data (offers, bookings, reviews).
 * Use this before a demo so you start with no submissions and can walk through
 * creating one request end-to-end. Schools, teachers, and agents are left intact.
 *
 * Run: pnpm db:clear-requests
 * Then run the app and follow the script to create a new request.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/lib/db/schema";

const sqlite = new Database("./quicksupply.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF");
const db = drizzle(sqlite, { schema });

// Delete in reverse dependency order (notification log is request/offer-related)
db.delete(schema.notificationLog).run();
db.delete(schema.schoolTeacherReviews).run();
db.delete(schema.bookings).run();
db.delete(schema.assignmentOffers).run();
db.delete(schema.coverRequests).run();

console.log("All cover requests, offers, bookings, reviews, and notification log entries have been cleared.");
console.log("Schools, teachers, and agents are unchanged. Run the app and create a new request.");

sqlite.close();
