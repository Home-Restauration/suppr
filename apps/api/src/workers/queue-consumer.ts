/**
 * Queue consumer — dequeues from Supabase pgmq 'notifications' queue
 * and dispatches via Twilio (SMS/WhatsApp) or Resend (email).
 * Runs as a Render background worker (apps/api build target: worker).
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function processNotifications() {
  const { data: messages } = await supabase.rpc("pgmq_read", {
    queue_name: "notifications",
    vt: 30,
    qty: 10,
  });

  if (!messages?.length) return;

  for (const msg of messages) {
    const payload = msg.message as Record<string, unknown>;
    console.log("Processing notification:", payload.type);

    // TODO: dispatch via Twilio / Resend based on payload.channel
    // After successful dispatch:
    await supabase.rpc("pgmq_delete", { queue_name: "notifications", msg_id: msg.msg_id });
  }
}

// Poll every 5 seconds
setInterval(processNotifications, 5_000);
processNotifications();
console.log("Queue consumer started");
