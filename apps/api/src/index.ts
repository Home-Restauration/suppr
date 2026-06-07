import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { stripeWebhookRoute } from "./webhooks/stripe.js";
import { stripeConnectWebhookRoute } from "./webhooks/stripe-connect.js";
import { muxWebhookRoute } from "./webhooks/mux.js";

const app = Fastify({ logger: true });

await app.register(cors, { origin: process.env.APP_URL });
await app.register(helmet);

app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

// Webhook routes — each registered as an isolated scoped plugin so their
// raw-body content-type parser doesn't bleed into other routes.
await app.register(stripeWebhookRoute);
await app.register(stripeConnectWebhookRoute);
await app.register(muxWebhookRoute);

// Routes will be registered here:
// await app.register(import("./routes/events.js").then(m => m.eventsRoute));
// await app.register(import("./routes/bookings.js").then(m => m.bookingsRoute));
// etc.

const port = Number(process.env.PORT ?? 3001);
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API running on port ${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
