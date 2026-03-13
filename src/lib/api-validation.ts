import { z } from "zod";
import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Helper: parse body with a Zod schema, return structured field errors on fail
// ---------------------------------------------------------------------------

type ValidationSuccess<T> = { success: true; data: T };
type ValidationFailure = { success: false; response: NextResponse };

export async function validateBody<T>(
  request: Request,
  schema: z.ZodType<T>
): Promise<ValidationSuccess<T> | ValidationFailure> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid JSON body", fieldErrors: {} },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_root";
      if (!fieldErrors[key]) fieldErrors[key] = [];
      fieldErrors[key].push(issue.message);
    }
    return {
      success: false,
      response: NextResponse.json(
        { error: "Validation failed", fieldErrors },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

// POST /api/auth (demo login)
export const demoLoginSchema = z.object({
  userId: z.string().min(1, "userId is required"),
});

// POST /api/auth/login
export const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

// POST /api/auth/forgot-password
export const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

// POST /api/auth/reset-password
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// PATCH /api/offers
export const offerResponseSchema = z.object({
  offerId: z.string().min(1, "offerId is required"),
  response: z.enum(["accepted", "declined"], {
    message: "Response must be 'accepted' or 'declined'",
  }),
});

// POST /api/assignments
export const assignmentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start_offering"),
    requestId: z.string().min(1, "requestId is required"),
  }),
  z.object({
    action: z.literal("manual_assign"),
    requestId: z.string().min(1, "requestId is required"),
    teacherId: z.string().min(1, "teacherId is required"),
  }),
  z.object({
    action: z.literal("cancel_booking"),
    bookingId: z.string().min(1, "bookingId is required"),
    reason: z.string().optional(),
  }),
  z.object({
    action: z.literal("withdraw_offer"),
    requestId: z.string().min(1, "requestId is required"),
  }),
  z.object({
    action: z.literal("rank_teachers"),
    requestId: z.string().min(1, "requestId is required"),
  }),
]);

// POST /api/requests (cover request)
export const coverRequestSchema = z.object({
  schoolId: z.string().min(1, "schoolId is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  roleNeeded: z.enum(["teacher", "ta"], { message: "roleNeeded must be 'teacher' or 'ta'" }),
  subject: z.string().nullable().optional(),
  keyStage: z.string().nullable().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "startTime must be HH:MM").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "endTime must be HH:MM").optional(),
  notes: z.string().nullable().optional(),
  preferredTeacherId: z.string().nullable().optional(),
  isEmergency: z.boolean().optional(),
}).refine(
  (data) => {
    const today = new Date().toISOString().slice(0, 10);
    return data.date >= today;
  },
  { message: "Date cannot be in the past", path: ["date"] }
).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: "Start time must be before end time", path: ["endTime"] }
);

// POST /api/school/reviews
export const reviewSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
  rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
  comment: z.string().nullable().optional(),
});

// PATCH /api/teacher/profile
export const teacherProfileSchema = z.object({
  canDrive: z.boolean(),
  maxDistanceMiles: z.number().min(0).max(100),
  emergencyAvailable: z.boolean(),
  contactNightBeforeOnly: z.boolean(),
  longTermWilling: z.boolean(),
  roleType: z.enum(["teacher", "ta", "both"]).optional(),
});

// POST /api/teacher/availability
export const teacherAvailabilitySchema = z.object({
  recurring: z.array(
    z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      isAvailable: z.boolean(),
    })
  ),
  unavailableDates: z.array(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Each date must be YYYY-MM-DD format")
  ),
});

// POST /api/settings
export const settingsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number()])
);

// POST /api/agency/teachers
export const agencyCreateTeacherSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required").max(20),
  postcode: z.string().min(1, "Postcode is required").max(10),
  roleType: z.enum(["teacher", "ta", "both"]),
  canDrive: z.boolean(),
  maxDistanceMiles: z.number().min(0).max(100),
  emergencyAvailable: z.boolean(),
  contactNightBeforeOnly: z.boolean(),
  longTermWilling: z.boolean(),
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// PATCH /api/agency/teachers/[id]
export const agencyUpdateTeacherSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).max(20).optional(),
  postcode: z.string().min(1).max(10).optional(),
  roleType: z.enum(["teacher", "ta", "both"]).optional(),
  canDrive: z.boolean().optional(),
  maxDistanceMiles: z.number().min(0).max(100).optional(),
  emergencyAvailable: z.boolean().optional(),
  contactNightBeforeOnly: z.boolean().optional(),
  longTermWilling: z.boolean().optional(),
});

// PATCH /api/agency/teachers/[id]/compliance
export const agencyUpdateComplianceSchema = z.object({
  dbsStatus: z.enum(["clear", "pending", "expired", "none"]),
  dbsExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").nullable().optional(),
  rightToWork: z.enum(["verified", "pending", "not_checked"]),
  complianceStatus: z.enum(["compliant", "pending", "expired"]),
  complianceNotes: z.string().max(500).nullable().optional(),
});

// POST /api/agency/teachers/[id]/credentials
export const agencySetCredentialsSchema = z.object({
  email: z.string().email("Valid email is required"),
  temporaryPassword: z.string().min(8, "Password must be at least 8 characters"),
});

// PATCH /api/agency/teachers/[id]/status
export const agencyTeacherStatusSchema = z.object({
  isActive: z.boolean(),
});
