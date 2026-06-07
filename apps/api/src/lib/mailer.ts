import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  return (_resend ??= new Resend(process.env.RESEND_API_KEY!));
}

const FROM = () => process.env.RESEND_FROM ?? "hello@suppr.co";

// ── Email payload union ─────────────────────────────────────────────────────

interface BasePayload {
  to: string;
}

export interface BookingConfirmedPayload extends BasePayload {
  kind: "booking-confirmed";
  guestName: string;
  eventTitle: string;
  eventDate: string;
  chefName: string;
  confirmationNumber: string;
  totalAmount: string;
}

export interface BookingCancelledPayload extends BasePayload {
  kind: "booking-cancelled";
  guestName: string;
  eventTitle: string;
  confirmationNumber: string;
  refundAmount?: string;
}

export interface WaitlistConfirmedPayload extends BasePayload {
  kind: "waitlist-confirmed";
  guestName: string;
  eventTitle: string;
  eventDate: string;
}

export interface EventReminderPayload extends BasePayload {
  kind: "event-reminder";
  guestName: string;
  eventTitle: string;
  eventDate: string;
  chefName: string;
  confirmationNumber: string;
}

export interface ReceiptPayload extends BasePayload {
  kind: "receipt";
  guestName: string;
  eventTitle: string;
  confirmationNumber: string;
  lineItems: Array<{ label: string; amount: string }>;
  total: string;
}

export interface ChefNewBookingPayload extends BasePayload {
  kind: "chef-new-booking";
  chefName: string;
  guestName: string;
  eventTitle: string;
  eventDate: string;
  guestCount: number;
  confirmationNumber: string;
}

export interface ChefEventSummaryPayload extends BasePayload {
  kind: "chef-event-summary";
  chefName: string;
  eventTitle: string;
  eventDate: string;
  totalCovers: number;
  totalRevenue: string;
  allergiesNote?: string;
}

export type EmailPayload =
  | BookingConfirmedPayload
  | BookingCancelledPayload
  | WaitlistConfirmedPayload
  | EventReminderPayload
  | ReceiptPayload
  | ChefNewBookingPayload
  | ChefEventSummaryPayload;

// ── Template builder ────────────────────────────────────────────────────────

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;color:#34302A;background:#FDFCFA;margin:0;padding:24px}
.card{background:#F7F4EE;border:1px solid #EAE4D9;border-radius:12px;padding:24px;max-width:520px;margin:0 auto}
h1{font-size:20px;margin:0 0 16px}p{margin:0 0 12px;line-height:1.5}
.accent{color:#C77B5C}.muted{color:#6B6458;font-size:14px}
hr{border:none;border-top:1px solid #EAE4D9;margin:16px 0}
</style></head><body><div class="card">${body}</div></body></html>`;
}

function buildEmail(p: EmailPayload): { subject: string; html: string } {
  switch (p.kind) {
    case "booking-confirmed":
      return {
        subject: `You're confirmed — ${p.eventTitle}`,
        html: wrap(
          "Booking Confirmed",
          `<h1>You're all set, ${p.guestName}!</h1>
           <p><strong>${p.eventTitle}</strong> with Chef ${p.chefName}</p>
           <p>${p.eventDate}</p>
           <hr>
           <p class="muted">Confirmation #${p.confirmationNumber} · Total paid: ${p.totalAmount}</p>`
        ),
      };

    case "booking-cancelled":
      return {
        subject: `Booking cancelled — ${p.eventTitle}`,
        html: wrap(
          "Booking Cancelled",
          `<h1>Your booking has been cancelled</h1>
           <p>Hi ${p.guestName}, your booking for <strong>${p.eventTitle}</strong> has been cancelled.</p>
           ${p.refundAmount ? `<p>Refund of <strong>${p.refundAmount}</strong> will appear in 5–10 business days.</p>` : ""}
           <p class="muted">Confirmation #${p.confirmationNumber}</p>`
        ),
      };

    case "waitlist-confirmed":
      return {
        subject: `You're on the waitlist — ${p.eventTitle}`,
        html: wrap(
          "Waitlist Confirmed",
          `<h1>You're on the list</h1>
           <p>Hi ${p.guestName}, you've been added to the waitlist for <strong>${p.eventTitle}</strong> on ${p.eventDate}.</p>
           <p>We'll notify you the moment a seat opens up.</p>`
        ),
      };

    case "event-reminder":
      return {
        subject: `Tomorrow: ${p.eventTitle}`,
        html: wrap(
          "Event Reminder",
          `<h1>Your dinner is tomorrow</h1>
           <p>Hi ${p.guestName}, just a reminder that <strong>${p.eventTitle}</strong> with Chef ${p.chefName} is happening on ${p.eventDate}.</p>
           <p class="muted">Confirmation #${p.confirmationNumber}</p>`
        ),
      };

    case "receipt":
      return {
        subject: `Receipt — ${p.eventTitle}`,
        html: wrap(
          "Receipt",
          `<h1>Receipt</h1>
           <p>Hi ${p.guestName}, here's your receipt for <strong>${p.eventTitle}</strong>.</p>
           <hr>
           ${p.lineItems.map((li) => `<p>${li.label} <strong>${li.amount}</strong></p>`).join("")}
           <hr>
           <p><strong>Total: ${p.total}</strong></p>
           <p class="muted">Confirmation #${p.confirmationNumber}</p>`
        ),
      };

    case "chef-new-booking":
      return {
        subject: `New booking — ${p.eventTitle}`,
        html: wrap(
          "New Booking",
          `<h1>New booking received</h1>
           <p>Hi Chef ${p.chefName}, <strong>${p.guestName}</strong> just booked ${p.guestCount} seat${p.guestCount !== 1 ? "s" : ""} for <strong>${p.eventTitle}</strong> on ${p.eventDate}.</p>
           <p class="muted">Confirmation #${p.confirmationNumber}</p>`
        ),
      };

    case "chef-event-summary":
      return {
        subject: `Event summary — ${p.eventTitle}`,
        html: wrap(
          "Event Summary",
          `<h1>Event wrap-up</h1>
           <p>Hi Chef ${p.chefName}, here's how <strong>${p.eventTitle}</strong> on ${p.eventDate} went:</p>
           <p>Covers: <strong>${p.totalCovers}</strong> · Revenue: <strong>${p.totalRevenue}</strong></p>
           ${p.allergiesNote ? `<p class="accent">${p.allergiesNote}</p>` : ""}
           <p class="muted">Thank you for hosting on Suppr.</p>`
        ),
      };
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

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
