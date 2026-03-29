import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { timesheets, teachers } from "@/lib/db/schema";
import { validateBody } from "@/lib/api-validation";
import { createNotification } from "@/lib/notifications";
import { logActivity } from "@/lib/activity-log";
import { sseManager } from "@/lib/sse-manager";

const timesheetActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
  }),
  z.object({
    action: z.literal("dispute"),
    reason: z
      .string()
      .min(1, "Dispute reason is required")
      .max(500, "Dispute reason must be 500 characters or fewer"),
  }),
]);

/** PATCH: Approve or dispute a timesheet. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "agent") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const timesheet = db
    .select()
    .from(timesheets)
    .where(eq(timesheets.id, id))
    .get();

  if (!timesheet) {
    return NextResponse.json({ error: "Timesheet not found" }, { status: 404 });
  }

  if (timesheet.status !== "submitted") {
    return NextResponse.json(
      { error: `Timesheet is already ${timesheet.status}` },
      { status: 400 }
    );
  }

  const parsed = await validateBody(request, timesheetActionSchema);
  if (!parsed.success) return parsed.response;

  const now = new Date();

  const teacher = db
    .select({ firstName: teachers.firstName, lastName: teachers.lastName })
    .from(teachers)
    .where(eq(teachers.id, timesheet.teacherId))
    .get();

  const teacherName = teacher
    ? `${teacher.firstName} ${teacher.lastName}`
    : "Unknown";

  if (parsed.data.action === "approve") {
    db.update(timesheets)
      .set({
        status: "approved",
        approvedAt: now,
      })
      .where(eq(timesheets.id, id))
      .run();

    createNotification({
      recipientType: "teacher",
      recipientId: timesheet.teacherId,
      type: "reminder",
      title: "Timesheet Approved",
      body: "Your timesheet has been approved by the agency.",
      relatedEntityType: "timesheet",
      relatedEntityId: id,
    });

    sseManager.emit(`teacher:${timesheet.teacherId}`, {
      type: "notification",
      data: { timesheetId: id, action: "approved" },
    });

    sseManager.emit("agency", {
      type: "notification",
      data: {
        timesheetId: id,
        action: "approved",
        teacherName,
      },
    });

    logActivity(session.userId, "agent", "timesheet_approved", "timesheet", id, {
      teacherId: timesheet.teacherId,
      teacherName,
    });
  } else {
    db.update(timesheets)
      .set({
        status: "disputed",
        disputeReason: parsed.data.reason,
      })
      .where(eq(timesheets.id, id))
      .run();

    createNotification({
      recipientType: "teacher",
      recipientId: timesheet.teacherId,
      type: "reminder",
      title: "Timesheet Disputed",
      body: `Your timesheet has been disputed: ${parsed.data.reason}`,
      relatedEntityType: "timesheet",
      relatedEntityId: id,
    });

    sseManager.emit(`teacher:${timesheet.teacherId}`, {
      type: "notification",
      data: { timesheetId: id, action: "disputed", reason: parsed.data.reason },
    });

    sseManager.emit("agency", {
      type: "notification",
      data: {
        timesheetId: id,
        action: "disputed",
        teacherName,
        reason: parsed.data.reason,
      },
    });

    logActivity(session.userId, "agent", "timesheet_disputed", "timesheet", id, {
      teacherId: timesheet.teacherId,
      teacherName,
      reason: parsed.data.reason,
    });
  }

  return NextResponse.json({ success: true });
}
