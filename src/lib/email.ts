import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL ?? "QuickSupply <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Sends an email with HTML content via Resend.
 * Gracefully skips when RESEND_API_KEY is not set (logs a warning in dev).
 * Never throws — emails should not break the app flow.
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[email] RESEND_API_KEY not set — skipping email to %s: %s", to, subject);
    }
    return;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
    }
  } catch (err) {
    console.error("[email] Send failed:", err);
  }
}

/**
 * Sends a plain-text notification email (legacy helper).
 * @deprecated Use `sendEmail` with an HTML template from `email-templates.ts` instead.
 */
export async function sendNotificationEmail(to: string, subject: string, body: string): Promise<boolean> {
  if (!resend) {
    if (process.env.NODE_ENV === "development") {
      console.log("[email] (no RESEND_API_KEY) would send to %s: %s", to, subject);
    }
    return true;
  }

  try {
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [to],
      subject,
      text: body,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] Send failed:", err);
    return false;
  }
}
