import type { InferSelectModel } from "drizzle-orm";
import type {
  schools,
  teachers,
  agents,
  coverRequests,
  assignmentOffers,
  bookings,
  teacherAvailability,
  notificationLog,
  schoolTeacherReviews,
} from "@/lib/db/schema";

// Database row types
export type School = InferSelectModel<typeof schools>;
export type Teacher = InferSelectModel<typeof teachers>;
export type Agent = InferSelectModel<typeof agents>;
export type CoverRequest = InferSelectModel<typeof coverRequests>;
export type AssignmentOffer = InferSelectModel<typeof assignmentOffers>;
export type Booking = InferSelectModel<typeof bookings>;
export type TeacherAvailability = InferSelectModel<typeof teacherAvailability>;
export type NotificationLogEntry = InferSelectModel<typeof notificationLog>;
export type SchoolTeacherReview = InferSelectModel<typeof schoolTeacherReviews>;

// Session types
export type UserRole = "school" | "teacher" | "agent";

export interface Session {
  userId: string;
  role: UserRole;
  name: string;
}

// SSE event types
export interface SSEEvent {
  type:
    | "new_request"
    | "offer_sent"
    | "new_offer"
    | "offer_accepted"
    | "offer_declined"
    | "offer_expired"
    | "request_filled"
    | "booking_cancelled"
    | "offer_withdrawn"
    | "notification";
  data: Record<string, unknown>;
  timestamp: number;
}

// Teacher ranking for assignment
export interface RankedTeacher {
  teacher: Teacher;
  score: number;
  distanceMiles: number;
  schoolReviewAvg: number | null;
  previouslyWorkedAtSchool: boolean;
  isPreferred: boolean;
  isBlacklisted: boolean;
}
