import Fastify, { type FastifyRequest } from "fastify";
import formbody from "@fastify/formbody";
import Twilio from "twilio";
import { runConcierge } from "./agent/concierge.js";

const app = Fastify({ logger: true });

// Twilio sends application/x-www-form-urlencoded
await app.register(formbody);

// Validate Twilio signature — enforced when BOT_URL is an https URL (production).
// Skipped in local dev when BOT_URL is localhost or unset.
function isTwilioRequestValid(req: FastifyRequest, webhookPath: string): boolean {
  const botUrl = process.env.BOT_URL ?? "";
  if (!botUrl.startsWith("https://")) return true;

  const signature = (req.headers["x-twilio-signature"] as string) ?? "";
  return Twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN!,
    signature,
    `${botUrl}${webhookPath}`,
    req.body as Record<string, string>
  );
}

function twiml(message: string): string {
  const escaped = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0"?><Response><Message>${escaped}</Message></Response>`;
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────
app.post("/webhooks/twilio/whatsapp", async (req, reply) => {
  if (!isTwilioRequestValid(req, "/webhooks/twilio/whatsapp")) {
    return reply.code(403).send("Forbidden");
  }

  const body = req.body as Record<string, string>;
  const from = body.From?.replace("whatsapp:", "");
  const text = body.Body;
  if (!from || !text) return reply.code(400).send("Bad request");

  // TODO: load/persist conversation history from Supabase keyed by `from`
  const { reply: botReply } = await runConcierge([{ role: "user", content: text }], "");

  reply.header("Content-Type", "text/xml");
  return twiml(botReply);
});

// ── SMS ───────────────────────────────────────────────────────────────────────
app.post("/webhooks/twilio/sms", async (req, reply) => {
  if (!isTwilioRequestValid(req, "/webhooks/twilio/sms")) {
    return reply.code(403).send("Forbidden");
  }

  const body = req.body as Record<string, string>;
  const from = body.From;
  const text = body.Body;
  if (!from || !text) return reply.code(400).send("Bad request");

  // TODO: load/persist conversation history from Supabase keyed by `from`
  const { reply: botReply } = await runConcierge([{ role: "user", content: text }], "");

  reply.header("Content-Type", "text/xml");
  return twiml(botReply);
});

// ── In-app web chat (SSE or JSON) ─────────────────────────────────────────────
app.post("/chat", async (req) => {
  const { messages } = req.body as { messages: import("./agent/concierge.js").ConversationMessage[] };
  return runConcierge(messages, "");
});

app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

await app.listen({ port: Number(process.env.PORT ?? 3002), host: "0.0.0.0" });
console.log("Bot running on port 3002");
