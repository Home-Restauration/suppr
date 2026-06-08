import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import { stripeWebhookRoute } from "./webhooks/stripe.js";
import { stripeConnectWebhookRoute } from "./webhooks/stripe-connect.js";
import { muxWebhookRoute } from "./webhooks/mux.js";
import { eventsRoute } from "./routes/events.js";
import { feedRoute } from "./routes/feed.js";
import { chefsRoute } from "./routes/chefs.js";
import { bookingsRoute } from "./routes/bookings.js";
import { chefApplicationsRoute } from "./routes/chef-applications.js";
import { chefRoute } from "./routes/chef.js";
import { adminRoute } from "./routes/admin.js";

const app = Fastify({ logger: true });

// CORS_ORIGINS: comma-separated list, e.g. "https://suppr.vercel.app,http://localhost:3000"
// Falls back to APP_URL for single-origin backwards compat.
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS ?? process.env.APP_URL ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
);
await app.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no Origin header (server-to-server, curl, health checks)
    if (!origin) return cb(null, true);
    cb(null, allowedOrigins.has(origin));
  },
  credentials: true,
});
await app.register(helmet);

app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));

// Webhook routes — raw-body parsers isolated in scoped plugins
await app.register(stripeWebhookRoute);
await app.register(stripeConnectWebhookRoute);
await app.register(muxWebhookRoute);

// Public discovery — no auth required
await app.register(eventsRoute);
await app.register(feedRoute);
await app.register(chefsRoute);

// Booking flow — name+email only, no account needed
await app.register(bookingsRoute);

// Public chef application
await app.register(chefApplicationsRoute);

// Chef console — authenticated (Bearer JWT)
await app.register(chefRoute);

// Admin console — admin role only
await app.register(adminRoute);

const port = Number(process.env.PORT ?? 3001);
try {
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`API running on port ${port}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
