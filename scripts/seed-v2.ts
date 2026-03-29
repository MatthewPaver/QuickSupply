import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ulid } from "ulid";
import * as schema from "../src/lib/db/schema";

const sqlite = new Database("./quicksupply.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF");
const db = drizzle(sqlite, { schema });

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function isoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

async function seedV2() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_ALLOW_PRODUCTION) {
    console.error(
      "\x1b[31mERROR: Refusing to seed in production.\x1b[0m\n" +
      "Set SEED_ALLOW_PRODUCTION=1 to override."
    );
    process.exit(1);
  }

  console.log("Seeding QuickSupply V2 data...\n");

  // ============================================================
  // Query existing data to build realistic references
  // ============================================================
  const existingTeachers = db.select().from(schema.teachers).all();
  const existingSchools = db.select().from(schema.schools).all();
  const existingBookings = db.select().from(schema.bookings).all();
  const existingAgents = db.select().from(schema.agents).all();

  if (existingTeachers.length === 0 || existingSchools.length === 0) {
    console.error("\x1b[31mERROR: No existing teachers/schools found. Run `pnpm db:seed` first.\x1b[0m");
    process.exit(1);
  }

  if (existingBookings.length === 0) {
    console.error("\x1b[31mERROR: No existing bookings found. Run `pnpm db:seed` first.\x1b[0m");
    process.exit(1);
  }

  console.log(`  Found ${existingTeachers.length} teachers, ${existingSchools.length} schools, ${existingBookings.length} bookings`);

  // ============================================================
  // PAY RATES
  // ============================================================
  // Clear existing V2 data before re-seeding
  db.delete(schema.payRates).run();

  const payRateEntries: (typeof schema.payRates.$inferInsert)[] = [
    // Default teacher rate: £15/hr pay, £22/hr charge (in pence)
    {
      id: ulid(),
      roleType: "teacher",
      schoolId: null,
      payRate: 1500,
      chargeRate: 2200,
      effectiveFrom: "2025-09-01",
      createdAt: daysAgo(60),
    },
    // Default TA rate: £11/hr pay, £16/hr charge (in pence)
    {
      id: ulid(),
      roleType: "ta",
      schoolId: null,
      payRate: 1100,
      chargeRate: 1600,
      effectiveFrom: "2025-09-01",
      createdAt: daysAgo(60),
    },
    // School-specific override: first school gets premium rates
    {
      id: ulid(),
      roleType: "teacher",
      schoolId: existingSchools[0].id,
      payRate: 1700,
      chargeRate: 2500,
      effectiveFrom: "2025-09-01",
      createdAt: daysAgo(30),
    },
  ];

  db.insert(schema.payRates).values(payRateEntries).run();
  console.log(`  ${payRateEntries.length} pay rates created`);

  // ============================================================
  // TIMESHEETS (3-5 for existing bookings)
  // ============================================================
  db.delete(schema.timesheets).run();

  const timesheetEntries: (typeof schema.timesheets.$inferInsert)[] = [];

  // Create timesheets for existing bookings (up to 5)
  const bookingsToSheet = existingBookings.slice(0, Math.min(existingBookings.length, 5));

  const timesheetStatuses: Array<"submitted" | "approved" | "disputed"> = [
    "approved",
    "submitted",
    "disputed",
    "approved",
    "submitted",
  ];

  for (let i = 0; i < bookingsToSheet.length; i++) {
    const booking = bookingsToSheet[i];
    const status = timesheetStatuses[i % timesheetStatuses.length];
    const submittedAt = daysAgo(bookingsToSheet.length - i);
    const totalHours = 6.5 - (i * 0.25); // Vary slightly

    const entry: typeof schema.timesheets.$inferInsert = {
      id: ulid(),
      bookingId: booking.id,
      teacherId: booking.teacherId,
      arrivalTime: "08:30",
      departureTime: "15:30",
      breakMinutes: 30,
      totalHours,
      status,
      submittedAt,
      approvedAt: status === "approved" ? daysAgo(bookingsToSheet.length - i - 1) : null,
      disputeReason: status === "disputed" ? "Arrival time does not match school records — school logged 09:15 arrival" : null,
      notes: i === 0 ? "Full day cover, all lessons delivered as planned" : null,
      createdAt: submittedAt,
    };

    timesheetEntries.push(entry);
  }

  if (timesheetEntries.length > 0) {
    db.insert(schema.timesheets).values(timesheetEntries).run();
  }
  console.log(`  ${timesheetEntries.length} timesheets created`);

  // ============================================================
  // COMPLIANCE DOCUMENTS (1-2 per teacher, first 4 teachers)
  // ============================================================
  db.delete(schema.complianceDocuments).run();

  const complianceEntries: (typeof schema.complianceDocuments.$inferInsert)[] = [];
  const verifyingAgent = existingAgents[0];

  // Teacher 1: DBS verified, right_to_work verified
  if (existingTeachers[0]) {
    complianceEntries.push({
      id: ulid(),
      teacherId: existingTeachers[0].id,
      documentType: "dbs",
      fileName: "dbs_certificate_johnson.pdf",
      filePath: "/uploads/compliance/dbs_certificate_johnson.pdf",
      status: "verified",
      expiryDate: isoDate(daysFromNow(180)),
      uploadedAt: daysAgo(45),
      verifiedAt: daysAgo(43),
      verifiedBy: verifyingAgent?.id ?? null,
      createdAt: daysAgo(45),
    });
    complianceEntries.push({
      id: ulid(),
      teacherId: existingTeachers[0].id,
      documentType: "right_to_work",
      fileName: "passport_johnson.pdf",
      filePath: "/uploads/compliance/passport_johnson.pdf",
      status: "verified",
      expiryDate: isoDate(daysFromNow(365)),
      uploadedAt: daysAgo(44),
      verifiedAt: daysAgo(42),
      verifiedBy: verifyingAgent?.id ?? null,
      createdAt: daysAgo(44),
    });
  }

  // Teacher 2: DBS verified, right_to_work pending
  if (existingTeachers[1]) {
    complianceEntries.push({
      id: ulid(),
      teacherId: existingTeachers[1].id,
      documentType: "dbs",
      fileName: "dbs_certificate_chen.pdf",
      filePath: "/uploads/compliance/dbs_certificate_chen.pdf",
      status: "verified",
      expiryDate: isoDate(daysFromNow(90)),
      uploadedAt: daysAgo(30),
      verifiedAt: daysAgo(28),
      verifiedBy: verifyingAgent?.id ?? null,
      createdAt: daysAgo(30),
    });
    complianceEntries.push({
      id: ulid(),
      teacherId: existingTeachers[1].id,
      documentType: "right_to_work",
      fileName: "visa_chen.pdf",
      filePath: "/uploads/compliance/visa_chen.pdf",
      status: "pending_verification",
      uploadedAt: daysAgo(5),
      createdAt: daysAgo(5),
    });
  }

  // Teacher 3: DBS pending
  if (existingTeachers[2]) {
    complianceEntries.push({
      id: ulid(),
      teacherId: existingTeachers[2].id,
      documentType: "dbs",
      fileName: "dbs_certificate_patel.pdf",
      filePath: "/uploads/compliance/dbs_certificate_patel.pdf",
      status: "pending_verification",
      expiryDate: isoDate(daysFromNow(270)),
      uploadedAt: daysAgo(3),
      createdAt: daysAgo(3),
    });
  }

  // Teacher 4: DBS expired
  if (existingTeachers[3]) {
    complianceEntries.push({
      id: ulid(),
      teacherId: existingTeachers[3].id,
      documentType: "dbs",
      fileName: "dbs_certificate_obrien.pdf",
      filePath: "/uploads/compliance/dbs_certificate_obrien.pdf",
      status: "expired",
      expiryDate: isoDate(daysAgo(14)),
      uploadedAt: daysAgo(400),
      verifiedAt: daysAgo(398),
      verifiedBy: verifyingAgent?.id ?? null,
      createdAt: daysAgo(400),
    });
  }

  if (complianceEntries.length > 0) {
    db.insert(schema.complianceDocuments).values(complianceEntries).run();
  }
  console.log(`  ${complianceEntries.length} compliance documents created`);

  // ============================================================
  // NOTIFICATION PREFERENCES (demo users, all enabled)
  // ============================================================
  db.delete(schema.notificationPreferences).run();

  const notifPrefEntries: (typeof schema.notificationPreferences.$inferInsert)[] = [];
  const categories = ["offers", "booking_confirmations", "cancellations", "reminders", "timesheets"] as const;

  // First 3 teachers get preferences
  for (let i = 0; i < Math.min(3, existingTeachers.length); i++) {
    for (const category of categories) {
      notifPrefEntries.push({
        id: ulid(),
        userId: existingTeachers[i].id,
        userRole: "teacher",
        category,
        pushEnabled: true,
        inAppEnabled: true,
      });
    }
  }

  // First school gets preferences
  if (existingSchools[0]) {
    for (const category of categories) {
      notifPrefEntries.push({
        id: ulid(),
        userId: existingSchools[0].id,
        userRole: "school",
        category,
        pushEnabled: true,
        inAppEnabled: true,
      });
    }
  }

  // First agent gets preferences
  if (existingAgents[0]) {
    for (const category of categories) {
      notifPrefEntries.push({
        id: ulid(),
        userId: existingAgents[0].id,
        userRole: "agent",
        category,
        pushEnabled: true,
        inAppEnabled: true,
      });
    }
  }

  if (notifPrefEntries.length > 0) {
    db.insert(schema.notificationPreferences).values(notifPrefEntries).run();
  }
  console.log(`  ${notifPrefEntries.length} notification preferences created`);

  // ============================================================
  // TEACHER SUBJECTS (2-3 teachers)
  // ============================================================
  // Check for existing entries first; the V1 seed may have created some
  const existingSubjects = db.select().from(schema.teacherSubjects).all();
  if (existingSubjects.length === 0) {
    const subjectEntries: (typeof schema.teacherSubjects.$inferInsert)[] = [];

    // Teacher 1 (Sarah Johnson) - teacher role
    if (existingTeachers[0]) {
      subjectEntries.push(
        { teacherId: existingTeachers[0].id, subject: "Maths" },
        { teacherId: existingTeachers[0].id, subject: "English" },
        { teacherId: existingTeachers[0].id, subject: "Science" },
      );
    }

    // Teacher 3 (Amira Patel) - teacher role
    if (existingTeachers[2]) {
      subjectEntries.push(
        { teacherId: existingTeachers[2].id, subject: "English" },
        { teacherId: existingTeachers[2].id, subject: "History" },
      );
    }

    // Teacher 5 (Emma Williams) - both role
    if (existingTeachers[4]) {
      subjectEntries.push(
        { teacherId: existingTeachers[4].id, subject: "Art" },
        { teacherId: existingTeachers[4].id, subject: "Music" },
        { teacherId: existingTeachers[4].id, subject: "PE" },
      );
    }

    if (subjectEntries.length > 0) {
      db.insert(schema.teacherSubjects).values(subjectEntries).run();
    }
    console.log(`  ${subjectEntries.length} teacher subject entries created`);
  } else {
    console.log(`  Skipped teacher subjects (${existingSubjects.length} already exist)`);
  }

  // ============================================================
  // RANKING WEIGHTS (appConfig)
  // ============================================================
  // Upsert ranking weight keys
  const rankingWeights = [
    { key: "ranking_weight_distance", value: "0.25" },
    { key: "ranking_weight_rating", value: "0.30" },
    { key: "ranking_weight_availability", value: "0.20" },
    { key: "ranking_weight_compliance", value: "0.15" },
    { key: "ranking_weight_preference", value: "0.10" },
  ];

  for (const rw of rankingWeights) {
    db.insert(schema.appConfig)
      .values(rw)
      .onConflictDoUpdate({
        target: schema.appConfig.key,
        set: { value: rw.value },
      })
      .run();
  }
  console.log(`  ${rankingWeights.length} ranking weight config entries set`);

  // ============================================================
  // Done
  // ============================================================
  sqlite.pragma("foreign_keys = ON");

  console.log("\nV2 seed complete!");
  console.log(`  ${payRateEntries.length} pay rates, ${timesheetEntries.length} timesheets, ${complianceEntries.length} compliance docs`);
  console.log("  Run \"pnpm dev\" to test V2 features");

  sqlite.close();
}

seedV2().catch((err) => {
  console.error("V2 seed failed:", err);
  process.exit(1);
});
