import Fastify from "fastify";
import { runConcierge } from "./agent/concierge.js";

const app = Fastify({ logger: true });

// WhatsApp/Twilio webhook
app.post("/webhooks/twilio/whatsapp", async (req, reply) => {
  const body = req.body as Record<string, string>;
  const from = body.From?.replace("whatsapp:", "");
  const text = body.Body;
  if (!from || !text) return reply.code(400).send("Bad request");

  // TODO: load conversation history from Supabase keyed by `from`
  const { reply: botReply } = await runConcierge([{ role: "user", content: text }], "");

  // Twilio TwiML response
  reply.header("Content-Type", "text/xml");
  return `<?xml version="1.0"?><Response><Message>${botReply}</Message></Response>`;
});

// SMS webhook
app.post("/webhooks/twilio/sms", async (req, reply) => {
  const body = req.body as Record<string, string>;
  const text = body.Body;
  const { reply: botReply } = await runConcierge([{ role: "user", content: text }], "");
  reply.header("Content-Type", "text/xml");
  return `<?xml version="1.0"?><Response><Message>${botReply}</Message></Response>`;
});

// In-app web chat (SSE or JSON)
app.post("/chat", async (req) => {
  const { messages } = req.body as { messages: any[] };
  return runConcierge(messages, "");
});

await app.listen({ port: Number(process.env.PORT ?? 3002), host: "0.0.0.0" });
console.log("Bot running on port 3002");
