import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  return (_resend ??= new Resend(process.env.RESEND_API_KEY!));
}

const FROM = () => process.env.RESEND_FROM ?? "hello@suppr.co";

export type EmailTemplate =
  | "booking_confirmation"
  | "address_release"
  | "booking_cancelled"
  | "booking_updated"
  | "event_reminder"
  | "waitlist_drop"
  | "chef_event_summary";

interface BaseEmailPayload {
  to: string;
  guestName?: string;
}

interface BookingConfirmationPayload extends BaseEmailPayload {
  template: "booking_confirmation";
  eventTitle: string;
  eventDate: string;
  venueName: string;
  guestCount: number;
  totalCents: number;
  bookingId: string;
}

interface AddressReleasePayload extends BaseEmailPayload {
  template: "address_release";
  eventTitle: string;
  eventDate: string;
  address: string;
  bookingId: string;
}

interface BookingCancelledPayload extends BaseEmailPayload {
  template: "booking_cancelled";
  eventTitle: string;
  eventDate: string;
  refundCents: number;
  bookingId: string;
}

interface BookingUpdatedPayload extends BaseEmailPayload {
  template: "booking_updated";
  eventTitle: string;
  eventDate: string;
  change: string;
  bookingId: string;
}

interface EventReminderPayload extends BaseEmailPayload {
  template: "event_reminder";
  eventTitle: string;
  eventDate: string;
  bookingId: string;
}

interface WaitlistDropPayload extends BaseEmailPayload {
  template: "waitlist_drop";
  eventTitle: string;
  eventDate: string;
  bookingUrl: string;
}

interface ChefEventSummaryPayload extends BaseEmailPayload {
  template: "chef_event_summary";
  eventTitle: string;
  eventDate: string;
  coversCount: number;
  grossCents: number;
  payoutCents: number;
}

type EmailPayload =
  | BookingConfirmationPayload
  | AddressReleasePayload
  | BookingCancelledPayload
  | BookingUpdatedPayload
  | EventReminderPayload
  | WaitlistDropPayload
  | ChefEventSummaryPayload;

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function buildEmail(payload: EmailPayload): { subject: string; html: string } {
  switch (payload.template) {
    case "booking_confirmation":
      return {
        subject: `Booking confirmed — ${payload.eventTitle}`,
        html: `<p>Hi ${payload.guestName ?? "there"},</p>
<p>Your booking for <strong>${payload.eventTitle}</strong> on ${payload.eventDate} is confirmed.</p>
<p>Party of ${payload.guestCount} · Total: ${formatCents(payload.totalCents)}</p>
<p>Booking ref: <code>${payload.bookingId}</code></p>
<p>You'll receive the exact address closer to the event.</p>`,
      };

    case "address_release":
      return {
        subject: `Your address for ${payload.eventTitle}`,
        html: `<p>Hi ${payload.guestName ?? "there"},</p>
<p>The address for <strong>${payload.eventTitle}</strong> on ${payload.eventDate} is:</p>
<p><strong>${payload.address}</strong></p>
<p>See you there!</p>`,
      };

    case "booking_cancelled":
      return {
        subject: `Booking cancelled — ${payload.eventTitle}`,
        html: `<p>Hi ${payload.guestName ?? "there"},</p>
<p>Your booking for <strong>${payload.eventTitle}</strong> on ${payload.eventDate} has been cancelled.</p>
${payload.refundCents > 0 ? `<p>Refund of ${formatCents(payload.refundCents)} will appear in 5–10 business days.</p>` : ""}
<p>Booking ref: <code>${payload.bookingId}</code></p>`,
      };

    case "booking_updated":
      return {
        subject: `Booking update — ${payload.eventTitle}`,
        html: `<p>Hi ${payload.guestName ?? "there"},</p>
<p>Your booking for <strong>${payload.eventTitle}</strong> on ${payload.eventDate} has been updated.</p>
<p>${payload.change}</p>
<p>Booking ref: <code>${payload.bookingId}</code></p>`,
      };

    case "event_reminder":
      return {
        subject: `Reminder — ${payload.eventTitle} is coming up`,
        html: `<p>Hi ${payload.guestName ?? "there"},</p>
<p>Just a reminder that <strong>${payload.eventTitle}</strong> is on ${payload.eventDate}.</p>
<p>Booking ref: <code>${payload.bookingId}</code></p>`,
      };

    case "waitlist_drop":
      return {
        subject: `A spot opened — ${payload.eventTitle}`,
        html: `<p>Hi ${payload.guestName ?? "there"},</p>
<p>A seat just opened up for <strong>${payload.eventTitle}</strong> on ${payload.eventDate}.</p>
<p><a href="${payload.bookingUrl}">Book now →</a></p>`,
      };

    case "chef_event_summary":
      return {
        subject: `Event summary — ${payload.eventTitle}`,
        html: `<p>Hi,</p>
<p>Here's your summary for <strong>${payload.eventTitle}</strong> on ${payload.eventDate}:</p>
<ul>
  <li>Covers: ${payload.coversCount}</li>
  <li>Gross revenue: ${formatCents(payload.grossCents)}</li>
  <li>Your payout: ${formatCents(payload.payoutCents)}</li>
</ul>`,
      };
  }
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const { subject, html } = buildEmail(payload);
  const { error } = await getResend().emails.send({
    from: FROM(),
    to: payload.to,
    subject,
    html,
  });
  if (error) throw new Error(`Resend error: ${JSON.stringify(error)}`);
}
