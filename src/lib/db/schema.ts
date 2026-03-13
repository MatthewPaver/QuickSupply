import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ============================================================
// CORE ENTITIES
// ============================================================

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  postcode: text("postcode").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  phase: text("phase", { enum: ["primary", "secondary", "all-through", "nursery", "special"] }).notNull().default("primary"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  postcode: text("postcode").notNull(),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  canDrive: integer("can_drive", { mode: "boolean" }).notNull().default(false),
  maxDistanceMiles: real("max_distance_miles").notNull().default(10),
  roleType: text("role_type", { enum: ["teacher", "ta", "both"] }).notNull().default("teacher"),
  emergencyAvailable: integer("emergency_available", { mode: "boolean" }).notNull().default(false),
  contactNightBeforeOnly: integer("contact_night_before_only", { mode: "boolean" }).notNull().default(false),
  agencyRating: real("agency_rating").notNull().default(3.0),
  complianceStatus: text("compliance_status", { enum: ["compliant", "pending", "expired"] }).notNull().default("pending"),
  complianceNotes: text("compliance_notes"),
  dbsStatus: text("dbs_status", { enum: ["clear", "pending", "expired", "none"] }).notNull().default("none"),
  dbsExpiry: text("dbs_expiry"),  // ISO date YYYY-MM-DD or null
  rightToWork: text("right_to_work", { enum: ["verified", "pending", "not_checked"] }).notNull().default("not_checked"),
  longTermWilling: integer("long_term_willing", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// RELATIONSHIPS
// ============================================================

export const agentTeacherAssignments = sqliteTable(
  "agent_teacher_assignments",
  {
    agentId: text("agent_id").notNull().references(() => agents.id),
    teacherId: text("teacher_id").notNull().references(() => teachers.id),
  },
  (table) => [
    primaryKey({ columns: [table.agentId, table.teacherId] }),
  ]
);

export const teacherAvailability = sqliteTable("teacher_availability", {
  id: text("id").primaryKey(),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  date: text("date"), // ISO date 'YYYY-MM-DD', NULL if recurring
  dayOfWeek: integer("day_of_week"), // 0=Sun..6=Sat, for recurring patterns
  isAvailable: integer("is_available", { mode: "boolean" }).notNull(),
  isRecurring: integer("is_recurring", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const teacherBlacklistedSchools = sqliteTable(
  "teacher_blacklisted_schools",
  {
    teacherId: text("teacher_id").notNull().references(() => teachers.id),
    schoolId: text("school_id").notNull().references(() => schools.id),
    reason: text("reason"),
  },
  (table) => [
    primaryKey({ columns: [table.teacherId, table.schoolId] }),
  ]
);

// ============================================================
// WORKFLOW
// ============================================================

export const coverRequests = sqliteTable("cover_requests", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  date: text("date").notNull(), // ISO date 'YYYY-MM-DD'
  roleNeeded: text("role_needed", { enum: ["teacher", "ta"] }).notNull(),
  subject: text("subject"),
  // Primary focus: EYFS or Year 1–6 (stored as text for flexibility)
  keyStage: text("key_stage"),
  startTime: text("start_time").notNull(), // 'HH:MM'
  endTime: text("end_time").notNull().default("15:30"),
  notes: text("notes"),
  preferredTeacherId: text("preferred_teacher_id").references(() => teachers.id),
  status: text("status", { enum: ["pending", "offering", "filled", "cancelled"] }).notNull().default("pending"),
  isEmergency: integer("is_emergency", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const assignmentOffers = sqliteTable("assignment_offers", {
  id: text("id").primaryKey(),
  coverRequestId: text("cover_request_id").notNull().references(() => coverRequests.id),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  offeredAt: integer("offered_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  status: text("status", { enum: ["pending", "accepted", "declined", "expired", "withdrawn"] }).notNull().default("pending"),
  responseAt: integer("response_at", { mode: "timestamp" }),
  offerOrder: integer("offer_order").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const bookings = sqliteTable("bookings", {
  id: text("id").primaryKey(),
  coverRequestId: text("cover_request_id").notNull().references(() => coverRequests.id),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  confirmedAt: integer("confirmed_at", { mode: "timestamp" }).notNull(),
  cancelledAt: integer("cancelled_at", { mode: "timestamp" }),
  cancelledBy: text("cancelled_by", { enum: ["agent", "teacher"] }),
  cancellationReason: text("cancellation_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ============================================================
// SUPPORTING
// ============================================================

export const schoolTeacherReviews = sqliteTable("school_teacher_reviews", {
  id: text("id").primaryKey(),
  schoolId: text("school_id").notNull().references(() => schools.id),
  teacherId: text("teacher_id").notNull().references(() => teachers.id),
  bookingId: text("booking_id").notNull().references(() => bookings.id),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const notificationLog = sqliteTable(
  "notification_log",
  {
    id: text("id").primaryKey(),
    recipientType: text("recipient_type", { enum: ["teacher", "school", "agent"] }).notNull(),
    recipientId: text("recipient_id").notNull(),
    type: text("type", { enum: ["offer", "accepted", "declined", "expired", "cancellation", "reminder", "filled"] }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    relatedEntityType: text("related_entity_type"),
    relatedEntityId: text("related_entity_id"),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("notification_log_read_created_at_idx").on(table.read, table.createdAt),
  ]
);

export const appConfig = sqliteTable("app_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(), // JSON-encoded
});

/** Password reset tokens for forgot-password flow. */
export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["school", "teacher", "agent"] }).notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_token_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_role_idx").on(table.userId, table.role),
    index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  ]
);
