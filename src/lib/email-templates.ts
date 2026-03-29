/**
 * Branded HTML email templates for QuickSupply notifications.
 * All templates use inline styles for maximum email client compatibility.
 */

const BRAND_COLOR = "#4c0673";
const BRAND_NAME = "QuickSupply by Desian Education";

function layout(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr>
    <td style="background-color:${BRAND_COLOR};padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${BRAND_NAME}</h1>
    </td>
  </tr>
  <!-- Body -->
  <tr>
    <td style="padding:32px;">
      ${bodyContent}
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="padding:16px 32px;background-color:#f9f9fb;border-top:1px solid #e8e8eb;">
      <p style="margin:0;font-size:12px;color:#8c8c8c;text-align:center;">
        This is an automated message from ${BRAND_NAME}. Please do not reply directly to this email.
      </p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function offerReceivedEmail(
  teacherName: string,
  schoolName: string,
  date: string,
  role: string,
  startTime: string,
  endTime: string,
): { subject: string; html: string } {
  const subject = `New cover offer: ${schoolName} on ${date}`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">New Cover Offer</h2>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Hi ${teacherName},
</p>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  You have received a new cover assignment offer. Please review the details below and respond as soon as possible.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f0fa;border-radius:6px;padding:0;margin:0 0 24px;">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 8px;font-size:14px;color:#666;"><strong>School:</strong> ${schoolName}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#666;"><strong>Date:</strong> ${date}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#666;"><strong>Role:</strong> ${role}</p>
    <p style="margin:0;font-size:14px;color:#666;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
  </td></tr>
</table>
<p style="margin:0;color:#333;font-size:15px;line-height:1.5;">
  Log in to QuickSupply to accept or decline this offer.
</p>`,
  );
  return { subject, html };
}

export function bookingConfirmedEmail(
  schoolName: string,
  teacherName: string,
  date: string,
): { subject: string; html: string } {
  const subject = `Booking confirmed: ${teacherName} on ${date}`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Booking Confirmed</h2>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Hi ${schoolName},
</p>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Great news! Your cover request has been filled.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0faf2;border-radius:6px;padding:0;margin:0 0 24px;">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 8px;font-size:14px;color:#666;"><strong>Teacher:</strong> ${teacherName}</p>
    <p style="margin:0;font-size:14px;color:#666;"><strong>Date:</strong> ${date}</p>
  </td></tr>
</table>
<p style="margin:0;color:#333;font-size:15px;line-height:1.5;">
  Log in to QuickSupply to view the full booking details.
</p>`,
  );
  return { subject, html };
}

export function bookingCancelledEmail(
  recipientName: string,
  date: string,
  reason: string,
): { subject: string; html: string } {
  const subject = `Booking cancelled: ${date}`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Booking Cancelled</h2>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Hi ${recipientName},
</p>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  A booking scheduled for <strong>${date}</strong> has been cancelled.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef0f0;border-radius:6px;padding:0;margin:0 0 24px;">
  <tr><td style="padding:16px;">
    <p style="margin:0;font-size:14px;color:#666;"><strong>Reason:</strong> ${reason}</p>
  </td></tr>
</table>
<p style="margin:0;color:#333;font-size:15px;line-height:1.5;">
  Log in to QuickSupply for more details or to arrange alternative cover.
</p>`,
  );
  return { subject, html };
}

export function timesheetDisputedEmail(
  teacherName: string,
  date: string,
  reason: string,
): { subject: string; html: string } {
  const subject = `Timesheet disputed: ${date}`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Timesheet Disputed</h2>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Hi ${teacherName},
</p>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Your timesheet for <strong>${date}</strong> has been disputed and requires your attention.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8e6;border-radius:6px;padding:0;margin:0 0 24px;">
  <tr><td style="padding:16px;">
    <p style="margin:0;font-size:14px;color:#666;"><strong>Reason:</strong> ${reason}</p>
  </td></tr>
</table>
<p style="margin:0;color:#333;font-size:15px;line-height:1.5;">
  Log in to QuickSupply to review and resolve the dispute.
</p>`,
  );
  return { subject, html };
}

export function complianceExpiringEmail(
  teacherName: string,
  documentType: string,
  expiryDate: string,
  daysUntil: number,
): { subject: string; html: string } {
  const urgencyLabel = daysUntil <= 7 ? "Urgent: " : "";
  const subject = `${urgencyLabel}${documentType} expiring on ${expiryDate}`;
  const html = layout(
    subject,
    `<h2 style="margin:0 0 16px;color:#1a1a1a;font-size:20px;">Compliance Document Expiring</h2>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  Hi ${teacherName},
</p>
<p style="margin:0 0 16px;color:#333;font-size:15px;line-height:1.5;">
  One of your compliance documents is ${daysUntil <= 0 ? "expired" : `expiring in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`}. Please take action to maintain your compliant status.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:${daysUntil <= 7 ? "#fef0f0" : "#fff8e6"};border-radius:6px;padding:0;margin:0 0 24px;">
  <tr><td style="padding:16px;">
    <p style="margin:0 0 8px;font-size:14px;color:#666;"><strong>Document:</strong> ${documentType}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#666;"><strong>Expiry Date:</strong> ${expiryDate}</p>
    <p style="margin:0;font-size:14px;color:#666;"><strong>Days Remaining:</strong> ${daysUntil <= 0 ? "Expired" : daysUntil}</p>
  </td></tr>
</table>
<p style="margin:0;color:#333;font-size:15px;line-height:1.5;">
  Log in to QuickSupply to upload an updated document.
</p>`,
  );
  return { subject, html };
}
