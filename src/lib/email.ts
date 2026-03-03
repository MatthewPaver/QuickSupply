import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL ?? "QuickSupply <onboarding@resend.dev>";

const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Sends a notification email. No-op if RESEND_API_KEY is not set (e.g. local dev).
 * Uses Resend free tier; FROM_EMAIL should be a verified domain in production.
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
