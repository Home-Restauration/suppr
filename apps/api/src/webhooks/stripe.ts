import type { FastifyPluginAsync } from "fastify";
import Stripe from "stripe";
import {
  fulfillCheckoutSession,
  expireCheckoutSession,
  handleChargeRefunded,
} from "./stripe-connect.js";

let _stripe: Stripe | null = null;
function getStripe() {
  return (_stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  }));
}

export const stripeWebhookRoute: FastifyPluginAsync = async (fastify) => {
  // Override JSON parser to preserve raw body for Stripe signature verification
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body)
  );

  fastify.post("/webhooks/stripe", async (request, reply) => {
    const sig = request.headers["stripe-signature"];
    if (!sig) {
      return reply.code(400).send({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        request.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      fastify.log.error(err, "[stripe] signature verification failed");
      return reply.code(400).send({ error: "Webhook signature verification failed" });
    }

    switch (event.type) {
      // ── Subscriptions ────────────────────────────────────────────────────────
      case "customer.subscription.created":
        console.log("[stripe] customer.subscription.created", event.id);
        break;

      case "customer.subscription.updated":
        console.log("[stripe] customer.subscription.updated", event.id);
        break;

      case "customer.subscription.deleted":
        console.log("[stripe] customer.subscription.deleted", event.id);
        break;

      case "customer.subscription.trial_will_end":
        console.log("[stripe] customer.subscription.trial_will_end", event.id);
        break;

      // ── Billing portal ───────────────────────────────────────────────────────
      case "billing_portal.session.created":
        console.log("[stripe] billing_portal.session.created", event.id);
        break;

      // ── Balance & payouts ────────────────────────────────────────────────────
      case "balance.available":
        console.log("[stripe] balance.available", event.id);
        break;

      case "payout.paid":
        console.log("[stripe] payout.paid", event.id);
        break;

      case "payout.failed":
        console.log("[stripe] payout.failed", event.id);
        break;

      // ── Reporting ────────────────────────────────────────────────────────────
      case "reporting.report_run.failed":
        console.log("[stripe] reporting.report_run.failed", event.id);
        break;

      case "reporting.report_run.succeeded":
        console.log("[stripe] reporting.report_run.succeeded", event.id);
        break;

      case "reporting.report_type.updated":
        console.log("[stripe] reporting.report_type.updated", event.id);
        break;

      // ── Radar & reviews ──────────────────────────────────────────────────────
      case "radar.early_fraud_warning.created":
        console.log("[stripe] radar.early_fraud_warning.created", event.id);
        break;

      case "review.opened":
        console.log("[stripe] review.opened", event.id);
        break;

      case "review.closed":
        console.log("[stripe] review.closed", event.id);
        break;

      // ── Checkout (destination charges — platform webhook) ────────────────────
      case "checkout.session.completed":
        await fulfillCheckoutSession(event.data.object as Stripe.Checkout.Session, fastify);
        break;

      case "checkout.session.expired":
        await expireCheckoutSession(event.data.object as Stripe.Checkout.Session, fastify);
        break;

      // ── Charge refunds ───────────────────────────────────────────────────────
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge, fastify);
        break;

      // ── Customers ────────────────────────────────────────────────────────────
      case "customer.deleted":
        fastify.log.info(`[stripe] customer.deleted ${event.id}`);
        break;

      default:
        fastify.log.warn(`[stripe] Unhandled event type: ${event.type}`);
    }

    return reply.code(200).send({ received: true });
  });
};
