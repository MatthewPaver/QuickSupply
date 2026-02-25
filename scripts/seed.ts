import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { ulid } from "ulid";
import * as schema from "../src/lib/db/schema";

const sqlite = new Database("./quicksupply.db");
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = OFF"); // Temporarily disable for seeding order
const db = drizzle(sqlite, { schema });

function now() {
  return new Date();
}

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

async function seed() {
  console.log("Seeding QuickSupply demo data...\n");

  // Clear all tables in reverse FK order
  db.delete(schema.schoolTeacherReviews).run();
  db.delete(schema.notificationLog).run();
  db.delete(schema.bookings).run();
  db.delete(schema.assignmentOffers).run();
  db.delete(schema.coverRequests).run();
  db.delete(schema.teacherBlacklistedSchools).run();
  db.delete(schema.teacherAvailability).run();
  db.delete(schema.agentTeacherAssignments).run();
  db.delete(schema.agents).run();
  db.delete(schema.teachers).run();
  db.delete(schema.schools).run();
  db.delete(schema.appConfig).run();

  // ============================================================
  // SCHOOLS (5 Liverpool schools)
  // ============================================================
  const schoolIds = {
    stMarys: "school-1",
    kensington: "school-2",
    broadgreen: "school-3",
    allSaints: "school-4",
    mossley: "school-5",
  };

  db.insert(schema.schools).values([
    {
      id: schoolIds.stMarys,
      name: "St. Mary's Catholic Primary",
      address: "10 Standish Street, Liverpool",
      postcode: "L3 5TF",
      lat: 53.4084,
      lng: -2.9916,
      contactName: "Catherine Walsh",
      contactEmail: "admin@stmarysliverpool.sch.uk",
      contactPhone: "0151 207 1234",
      passwordHash: "demo",
      createdAt: daysAgo(90),
    },
    {
      id: schoolIds.kensington,
      name: "Kensington Primary School",
      address: "Brae Street, Liverpool",
      postcode: "L7 2RJ",
      lat: 53.4055,
      lng: -2.9393,
      contactName: "David Turner",
      contactEmail: "admin@kensingtonprimary.sch.uk",
      contactPhone: "0151 263 5678",
      passwordHash: "demo",
      createdAt: daysAgo(90),
    },
    {
      id: schoolIds.broadgreen,
      name: "Broadgreen International School",
      address: "Queens Drive, Liverpool",
      postcode: "L16 8NQ",
      lat: 53.4121,
      lng: -2.8851,
      contactName: "Linda McKenzie",
      contactEmail: "admin@broadgreen.sch.uk",
      contactPhone: "0151 722 1561",
      passwordHash: "demo",
      createdAt: daysAgo(85),
    },
    {
      id: schoolIds.allSaints,
      name: "All Saints Catholic Primary",
      address: "Oakfield Road, Anfield, Liverpool",
      postcode: "L4 0UF",
      lat: 53.4320,
      lng: -2.9545,
      contactName: "Patrick Brennan",
      contactEmail: "admin@allsaintsliverpool.sch.uk",
      contactPhone: "0151 263 2323",
      passwordHash: "demo",
      createdAt: daysAgo(80),
    },
    {
      id: schoolIds.mossley,
      name: "Mossley Hill Primary",
      address: "Elmswood Road, Liverpool",
      postcode: "L18 1LQ",
      lat: 53.3850,
      lng: -2.9145,
      contactName: "Helen Foster",
      contactEmail: "admin@mossleyhill.sch.uk",
      contactPhone: "0151 724 1647",
      passwordHash: "demo",
      createdAt: daysAgo(75),
    },
  ]).run();

  console.log("  5 schools created");

  // ============================================================
  // TEACHERS (12 teachers/TAs)
  // ============================================================
  const teacherIds = {
    sarahJ: "teacher-1",
    michaelC: "teacher-2",
    amiraP: "teacher-3",
    jamesOB: "teacher-4",
    emmaW: "teacher-5",
    danL: "teacher-6",
    fatimaH: "teacher-7",
    tomR: "teacher-8",
    rachelK: "teacher-9",
    benT: "teacher-10",
    lisaM: "teacher-11",
    carlosG: "teacher-12",
  };

  db.insert(schema.teachers).values([
    {
      id: teacherIds.sarahJ,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@email.com",
      phone: "07700 900001",
      passwordHash: "demo",
      postcode: "L15 6TN",
      lat: 53.3950,
      lng: -2.9200,
      canDrive: true,
      maxDistanceMiles: 15,
      roleType: "teacher",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 4.8,
      complianceStatus: "compliant",
      longTermWilling: true,
      createdAt: daysAgo(60),
    },
    {
      id: teacherIds.michaelC,
      firstName: "Michael",
      lastName: "Chen",
      email: "michael.chen@email.com",
      phone: "07700 900002",
      passwordHash: "demo",
      postcode: "L8 0SY",
      lat: 53.3870,
      lng: -2.9630,
      canDrive: false,
      maxDistanceMiles: 5,
      roleType: "ta",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 4.2,
      complianceStatus: "compliant",
      longTermWilling: false,
      createdAt: daysAgo(55),
    },
    {
      id: teacherIds.amiraP,
      firstName: "Amira",
      lastName: "Patel",
      email: "amira.patel@email.com",
      phone: "07700 900003",
      passwordHash: "demo",
      postcode: "L17 7BD",
      lat: 53.3780,
      lng: -2.9320,
      canDrive: true,
      maxDistanceMiles: 20,
      roleType: "teacher",
      emergencyAvailable: false,
      contactNightBeforeOnly: true,
      agencyRating: 4.5,
      complianceStatus: "compliant",
      longTermWilling: true,
      createdAt: daysAgo(50),
    },
    {
      id: teacherIds.jamesOB,
      firstName: "James",
      lastName: "O'Brien",
      email: "james.obrien@email.com",
      phone: "07700 900004",
      passwordHash: "demo",
      postcode: "L6 5DR",
      lat: 53.4190,
      lng: -2.9510,
      canDrive: false,
      maxDistanceMiles: 4,
      roleType: "ta",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 3.8,
      complianceStatus: "compliant",
      longTermWilling: false,
      createdAt: daysAgo(45),
    },
    {
      id: teacherIds.emmaW,
      firstName: "Emma",
      lastName: "Williams",
      email: "emma.williams@email.com",
      phone: "07700 900005",
      passwordHash: "demo",
      postcode: "L25 5JQ",
      lat: 53.3650,
      lng: -2.8700,
      canDrive: true,
      maxDistanceMiles: 12,
      roleType: "both",
      emergencyAvailable: false,
      contactNightBeforeOnly: false,
      agencyRating: 4.6,
      complianceStatus: "compliant",
      longTermWilling: true,
      createdAt: daysAgo(40),
    },
    {
      id: teacherIds.danL,
      firstName: "Daniel",
      lastName: "Lewis",
      email: "daniel.lewis@email.com",
      phone: "07700 900006",
      passwordHash: "demo",
      postcode: "L12 0BP",
      lat: 53.4230,
      lng: -2.8990,
      canDrive: true,
      maxDistanceMiles: 10,
      roleType: "teacher",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 3.5,
      complianceStatus: "compliant",
      longTermWilling: false,
      createdAt: daysAgo(35),
    },
    {
      id: teacherIds.fatimaH,
      firstName: "Fatima",
      lastName: "Hassan",
      email: "fatima.hassan@email.com",
      phone: "07700 900007",
      passwordHash: "demo",
      postcode: "L9 3BS",
      lat: 53.4450,
      lng: -2.9650,
      canDrive: false,
      maxDistanceMiles: 6,
      roleType: "ta",
      emergencyAvailable: false,
      contactNightBeforeOnly: true,
      agencyRating: 4.0,
      complianceStatus: "pending",
      complianceNotes: "DBS renewal in progress",
      longTermWilling: true,
      createdAt: daysAgo(30),
    },
    {
      id: teacherIds.tomR,
      firstName: "Thomas",
      lastName: "Roberts",
      email: "tom.roberts@email.com",
      phone: "07700 900008",
      passwordHash: "demo",
      postcode: "L3 8EN",
      lat: 53.4100,
      lng: -2.9800,
      canDrive: true,
      maxDistanceMiles: 15,
      roleType: "both",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 4.3,
      complianceStatus: "compliant",
      longTermWilling: false,
      createdAt: daysAgo(25),
    },
    {
      id: teacherIds.rachelK,
      firstName: "Rachel",
      lastName: "Kelly",
      email: "rachel.kelly@email.com",
      phone: "07700 900009",
      passwordHash: "demo",
      postcode: "L18 9TT",
      lat: 53.3800,
      lng: -2.9050,
      canDrive: true,
      maxDistanceMiles: 18,
      roleType: "teacher",
      emergencyAvailable: false,
      contactNightBeforeOnly: false,
      agencyRating: 4.9,
      complianceStatus: "compliant",
      longTermWilling: true,
      createdAt: daysAgo(20),
    },
    {
      id: teacherIds.benT,
      firstName: "Benjamin",
      lastName: "Thompson",
      email: "ben.thompson@email.com",
      phone: "07700 900010",
      passwordHash: "demo",
      postcode: "L4 4EG",
      lat: 53.4350,
      lng: -2.9600,
      canDrive: false,
      maxDistanceMiles: 5,
      roleType: "ta",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 3.2,
      complianceStatus: "expired",
      complianceNotes: "Safeguarding certificate expired 2 weeks ago",
      longTermWilling: false,
      createdAt: daysAgo(15),
    },
    {
      id: teacherIds.lisaM,
      firstName: "Lisa",
      lastName: "Murphy",
      email: "lisa.murphy@email.com",
      phone: "07700 900011",
      passwordHash: "demo",
      postcode: "L14 3NL",
      lat: 53.4080,
      lng: -2.8950,
      canDrive: true,
      maxDistanceMiles: 10,
      roleType: "both",
      emergencyAvailable: false,
      contactNightBeforeOnly: false,
      agencyRating: 4.1,
      complianceStatus: "compliant",
      longTermWilling: true,
      createdAt: daysAgo(10),
    },
    {
      id: teacherIds.carlosG,
      firstName: "Carlos",
      lastName: "Garcia",
      email: "carlos.garcia@email.com",
      phone: "07700 900012",
      passwordHash: "demo",
      postcode: "L1 1JQ",
      lat: 53.4030,
      lng: -2.9880,
      canDrive: true,
      maxDistanceMiles: 20,
      roleType: "teacher",
      emergencyAvailable: true,
      contactNightBeforeOnly: false,
      agencyRating: 3.9,
      complianceStatus: "compliant",
      longTermWilling: false,
      createdAt: daysAgo(5),
    },
  ]).run();

  console.log("  12 teachers/TAs created");

  // ============================================================
  // AGENTS (3)
  // ============================================================
  const agentIds = {
    sarah: "agent-1",
    james: "agent-2",
    emma: "agent-3",
  };

  db.insert(schema.agents).values([
    {
      id: agentIds.sarah,
      name: "Sarah Mitchell",
      email: "sarah.mitchell@desian.co.uk",
      passwordHash: "demo",
      isAdmin: true,
      createdAt: daysAgo(100),
    },
    {
      id: agentIds.james,
      name: "James Powell",
      email: "james.powell@desian.co.uk",
      passwordHash: "demo",
      isAdmin: false,
      createdAt: daysAgo(80),
    },
    {
      id: agentIds.emma,
      name: "Emma Rodriguez",
      email: "emma.rodriguez@desian.co.uk",
      passwordHash: "demo",
      isAdmin: false,
      createdAt: daysAgo(60),
    },
  ]).run();

  console.log("  3 agents created");

  // ============================================================
  // AGENT-TEACHER ASSIGNMENTS
  // ============================================================
  db.insert(schema.agentTeacherAssignments).values([
    // Sarah Mitchell (admin) oversees 6 teachers
    { agentId: agentIds.sarah, teacherId: teacherIds.sarahJ },
    { agentId: agentIds.sarah, teacherId: teacherIds.michaelC },
    { agentId: agentIds.sarah, teacherId: teacherIds.amiraP },
    { agentId: agentIds.sarah, teacherId: teacherIds.jamesOB },
    { agentId: agentIds.sarah, teacherId: teacherIds.emmaW },
    { agentId: agentIds.sarah, teacherId: teacherIds.danL },
    // James Powell oversees 4 teachers
    { agentId: agentIds.james, teacherId: teacherIds.fatimaH },
    { agentId: agentIds.james, teacherId: teacherIds.tomR },
    { agentId: agentIds.james, teacherId: teacherIds.rachelK },
    { agentId: agentIds.james, teacherId: teacherIds.benT },
    // Emma Rodriguez oversees 2 teachers
    { agentId: agentIds.emma, teacherId: teacherIds.lisaM },
    { agentId: agentIds.emma, teacherId: teacherIds.carlosG },
  ]).run();

  console.log("  Agent-teacher assignments created");

  // ============================================================
  // TEACHER AVAILABILITY (recurring patterns + specific dates)
  // ============================================================
  const availEntries: (typeof schema.teacherAvailability.$inferInsert)[] = [];

  // Sarah Johnson - available all week
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.sarahJ,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(30),
    });
  }

  // Michael Chen - available Mon-Fri
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.michaelC,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(28),
    });
  }

  // Amira Patel - Wed to Fri only
  for (let d = 3; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.amiraP,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(26),
    });
  }
  // Mon & Tue unavailable
  for (let d = 1; d <= 2; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.amiraP,
      dayOfWeek: d,
      isAvailable: false,
      isRecurring: true,
      createdAt: daysAgo(26),
    });
  }

  // James O'Brien - Mon-Thu
  for (let d = 1; d <= 4; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.jamesOB,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(24),
    });
  }
  availEntries.push({
    id: ulid(),
    teacherId: teacherIds.jamesOB,
    dayOfWeek: 5,
    isAvailable: false,
    isRecurring: true,
    createdAt: daysAgo(24),
  });

  // Emma Williams - all week
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.emmaW,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(22),
    });
  }

  // Daniel Lewis - Mon, Tue, Fri
  [1, 2, 5].forEach((d) => {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.danL,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(20),
    });
  });
  [3, 4].forEach((d) => {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.danL,
      dayOfWeek: d,
      isAvailable: false,
      isRecurring: true,
      createdAt: daysAgo(20),
    });
  });

  // Fatima Hassan - all week
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.fatimaH,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(18),
    });
  }

  // Thomas Roberts - all week
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.tomR,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(16),
    });
  }

  // Rachel Kelly - Mon-Fri
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.rachelK,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(14),
    });
  }

  // Ben Thompson - Tue-Thu
  [2, 3, 4].forEach((d) => {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.benT,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(12),
    });
  });
  [1, 5].forEach((d) => {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.benT,
      dayOfWeek: d,
      isAvailable: false,
      isRecurring: true,
      createdAt: daysAgo(12),
    });
  });

  // Lisa Murphy - all week
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.lisaM,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(10),
    });
  }

  // Carlos Garcia - all week
  for (let d = 1; d <= 5; d++) {
    availEntries.push({
      id: ulid(),
      teacherId: teacherIds.carlosG,
      dayOfWeek: d,
      isAvailable: true,
      isRecurring: true,
      createdAt: daysAgo(8),
    });
  }

  // Specific date overrides
  // Sarah Johnson - unavailable tomorrow (doctor appointment)
  availEntries.push({
    id: ulid(),
    teacherId: teacherIds.sarahJ,
    date: isoDate(daysFromNow(1)),
    isAvailable: false,
    isRecurring: false,
    createdAt: daysAgo(1),
  });

  // Rachel Kelly - unavailable in 3 days (personal)
  availEntries.push({
    id: ulid(),
    teacherId: teacherIds.rachelK,
    date: isoDate(daysFromNow(3)),
    isAvailable: false,
    isRecurring: false,
    createdAt: daysAgo(2),
  });

  db.insert(schema.teacherAvailability).values(availEntries).run();

  console.log(`  ${availEntries.length} availability entries created`);

  // ============================================================
  // TEACHER BLACKLISTED SCHOOLS
  // ============================================================
  db.insert(schema.teacherBlacklistedSchools).values([
    { teacherId: teacherIds.danL, schoolId: schoolIds.kensington, reason: "Previous incident" },
    { teacherId: teacherIds.tomR, schoolId: schoolIds.broadgreen, reason: "Teacher requested removal" },
    { teacherId: teacherIds.benT, schoolId: schoolIds.stMarys, reason: "School requested different staff" },
  ]).run();

  console.log("  3 blacklist entries created");

  // ============================================================
  // COVER REQUESTS (7 - various states)
  // ============================================================
  const requestIds = {
    filled1: ulid(),
    filled2: ulid(),
    offering: ulid(),
    offeringSarah: ulid(), // Second "offering" request so Sarah Johnson has a pending offer to see on Jobs
    pending1: ulid(),
    pending2: ulid(),
    pending3: ulid(),
    cancelled: ulid(),
  };

  db.insert(schema.coverRequests).values([
    // 2 filled (past dates)
    {
      id: requestIds.filled1,
      schoolId: schoolIds.stMarys,
      date: isoDate(daysAgo(5)),
      roleNeeded: "teacher",
      subject: "Maths",
      keyStage: "Year 4",
      startTime: "08:30",
      endTime: "15:30",
      status: "filled",
      isEmergency: false,
      createdAt: daysAgo(7),
    },
    {
      id: requestIds.filled2,
      schoolId: schoolIds.kensington,
      date: isoDate(daysAgo(3)),
      roleNeeded: "ta",
      keyStage: "EYFS",
      startTime: "08:45",
      endTime: "15:15",
      status: "filled",
      isEmergency: false,
      createdAt: daysAgo(5),
    },
    // 1 currently being offered (to Emma)
    {
      id: requestIds.offering,
      schoolId: schoolIds.broadgreen,
      date: isoDate(daysFromNow(1)),
      roleNeeded: "teacher",
      subject: "English",
      keyStage: "Year 6",
      startTime: "08:30",
      endTime: "15:30",
      notes: "Year 9 class - curriculum pack in staffroom",
      status: "offering",
      isEmergency: false,
      createdAt: daysAgo(1),
    },
    // 1 currently being offered to Sarah Johnson (so teacher Jobs page shows an active offer when logged in as Sarah)
    {
      id: requestIds.offeringSarah,
      schoolId: schoolIds.stMarys,
      date: isoDate(daysFromNow(1)),
      roleNeeded: "teacher",
      subject: "Maths",
      keyStage: "Year 5",
      startTime: "08:30",
      endTime: "15:30",
      notes: "Year 5 cover",
      status: "offering",
      isEmergency: false,
      createdAt: daysAgo(0),
    },
    // 3 pending
    {
      id: requestIds.pending1,
      schoolId: schoolIds.allSaints,
      date: isoDate(daysFromNow(0)),
      roleNeeded: "ta",
      keyStage: "Year 1",
      startTime: "08:30",
      endTime: "15:30",
      notes: "SEN support needed",
      status: "pending",
      isEmergency: true,
      createdAt: now(),
    },
    {
      id: requestIds.pending2,
      schoolId: schoolIds.mossley,
      date: isoDate(daysFromNow(2)),
      roleNeeded: "teacher",
      subject: "Science",
      keyStage: "Year 4",
      startTime: "09:00",
      endTime: "15:30",
      preferredTeacherId: teacherIds.sarahJ,
      status: "pending",
      isEmergency: false,
      createdAt: now(),
    },
    {
      id: requestIds.pending3,
      schoolId: schoolIds.stMarys,
      date: isoDate(daysFromNow(1)),
      roleNeeded: "ta",
      keyStage: "Year 2",
      startTime: "08:30",
      endTime: "12:30",
      notes: "Morning only cover",
      status: "pending",
      isEmergency: false,
      createdAt: now(),
    },
    // 1 cancelled
    {
      id: requestIds.cancelled,
      schoolId: schoolIds.kensington,
      date: isoDate(daysAgo(1)),
      roleNeeded: "teacher",
      subject: "PE",
      keyStage: "Year 3",
      startTime: "08:30",
      endTime: "15:30",
      status: "cancelled",
      isEmergency: false,
      createdAt: daysAgo(3),
    },
  ]).run();

  console.log("  7 cover requests created");

  // ============================================================
  // BOOKINGS (for filled requests)
  // ============================================================
  const bookingIds = { b1: ulid(), b2: ulid() };

  db.insert(schema.bookings).values([
    {
      id: bookingIds.b1,
      coverRequestId: requestIds.filled1,
      teacherId: teacherIds.sarahJ,
      confirmedAt: daysAgo(6),
      createdAt: daysAgo(6),
    },
    {
      id: bookingIds.b2,
      coverRequestId: requestIds.filled2,
      teacherId: teacherIds.michaelC,
      confirmedAt: daysAgo(4),
      createdAt: daysAgo(4),
    },
  ]).run();

  console.log("  2 bookings created");

  // ============================================================
  // ASSIGNMENT OFFERS (for the "offering" request + history)
  // ============================================================
  const offerExpires = new Date();
  offerExpires.setMinutes(offerExpires.getMinutes() + 7);

  db.insert(schema.assignmentOffers).values([
    // Past offers on filled request 1
    {
      id: ulid(),
      coverRequestId: requestIds.filled1,
      teacherId: teacherIds.sarahJ,
      offeredAt: daysAgo(7),
      expiresAt: daysAgo(7),
      status: "accepted",
      responseAt: daysAgo(6),
      offerOrder: 1,
      createdAt: daysAgo(7),
    },
    // Past offers on filled request 2 (first declined, second accepted)
    {
      id: ulid(),
      coverRequestId: requestIds.filled2,
      teacherId: teacherIds.jamesOB,
      offeredAt: daysAgo(5),
      expiresAt: daysAgo(5),
      status: "declined",
      responseAt: daysAgo(5),
      offerOrder: 1,
      createdAt: daysAgo(5),
    },
    {
      id: ulid(),
      coverRequestId: requestIds.filled2,
      teacherId: teacherIds.michaelC,
      offeredAt: daysAgo(5),
      expiresAt: daysAgo(4),
      status: "accepted",
      responseAt: daysAgo(4),
      offerOrder: 2,
      createdAt: daysAgo(5),
    },
    // Active offer on "offering" request (Emma)
    {
      id: ulid(),
      coverRequestId: requestIds.offering,
      teacherId: teacherIds.emmaW,
      offeredAt: now(),
      expiresAt: offerExpires,
      status: "pending",
      offerOrder: 1,
      createdAt: now(),
    },
    // Active offer to Sarah Johnson (offeringSarah request) so Jobs page shows data when logged in as Sarah
    {
      id: ulid(),
      coverRequestId: requestIds.offeringSarah,
      teacherId: teacherIds.sarahJ,
      offeredAt: now(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      status: "pending",
      offerOrder: 1,
      createdAt: now(),
    },
  ]).run();

  console.log("  5 assignment offers created");

  // ============================================================
  // SCHOOL-TEACHER REVIEWS
  // ============================================================
  db.insert(schema.schoolTeacherReviews).values([
    {
      id: ulid(),
      schoolId: schoolIds.stMarys,
      teacherId: teacherIds.sarahJ,
      bookingId: bookingIds.b1,
      rating: 5,
      comment: "Excellent teacher, class was well behaved and engaged throughout.",
      createdAt: daysAgo(4),
    },
    {
      id: ulid(),
      schoolId: schoolIds.kensington,
      teacherId: teacherIds.michaelC,
      bookingId: bookingIds.b2,
      rating: 4,
      comment: "Good TA, worked well with the children. Would request again.",
      createdAt: daysAgo(2),
    },
  ]).run();

  console.log("  2 reviews created");

  // ============================================================
  // APP CONFIG
  // ============================================================
  db.insert(schema.appConfig).values([
    { key: "morning_response_window_minutes", value: "7" },
    { key: "next_day_response_window_minutes", value: "60" },
    { key: "default_start_time", value: "08:30" },
    { key: "default_end_time", value: "15:30" },
  ]).run();

  console.log("  App config set");

  sqlite.pragma("foreign_keys = ON");

  console.log("\nSeed complete!");
  console.log("  5 schools, 12 teachers, 3 agents, 7 requests, 2 bookings");
  console.log('  Run "pnpm dev" to start the demo');

  sqlite.close();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
