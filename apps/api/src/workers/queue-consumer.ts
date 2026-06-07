/**
 * Queue consumer — dequeues from Supabase pgmq 'notifications' queue
 * and dispatches via Twilio (SMS/WhatsApp) or Resend (email).
 * Runs as a Render background worker (apps/api build target: worker).
 */
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../lib/mailer.js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface NotificationPayload {
  channel: "sms" | "whatsapp" | "imessage" | "email" | "webpush";
  template: string;
  to: string;
  [key: string]: unknown;
}

async function processNotifications() {
  const { data: messages } = await supabase.rpc("pgmq_read", {
    queue_name: "notifications",
    vt: 30,
    qty: 10,
  });

  if (!messages?.length) return;

  for (const msg of messages) {
    const payload = msg.message as NotificationPayload;

    try {
      switch (payload.channel) {
        case "email":
          await sendEmail(payload as any); // Codex: cast to EmailPayload once templates stabilise
          break;

        case "sms":
        case "whatsapp":
          // TODO: Twilio dispatch (Codex)
          console.log(`[queue] SMS/WhatsApp stub — channel=${payload.channel} to=${payload.to}`);
          break;

        case "imessage":
          // TODO: Blooio dispatch (Codex)
          console.log(`[queue] iMessage stub — to=${payload.to}`);
          break;

        case "webpush":
          // TODO: Web Push dispatch (Codex)
          console.log(`[queue] Web Push stub — to=${payload.to}`);
          break;

        default:
          console.warn(`[queue] Unknown channel: ${(payload as any).channel}`);
      }

      await supabase.rpc("pgmq_delete", {
        queue_name: "notifications",
        msg_id: msg.msg_id,
      });
    } catch (err) {
      console.error(`[queue] Failed to process msg ${msg.msg_id}:`, err);
      // Leave in queue — it will become visible again after vt=30s for retry
    }
  }
}

// Poll every 5 seconds
setInterval(processNotifications, 5_000);
processNotifications();
console.log("Queue consumer started");
