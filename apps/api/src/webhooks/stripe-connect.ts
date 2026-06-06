import type { FastifyPluginAsync } from "fastify";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

let _stripe: Stripe | null = null;
function getStripe() {
  return (_stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-02-24.acacia",
  }));
}

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const stripeConnectWebhookRoute: FastifyPluginAsync = async (fastify) => {
  // Override JSON parser to preserve raw body for Stripe signature verification
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "buffer" },
    (_req, body, done) => done(null, body)
  );

  fastify.post("/webhooks/stripe/connect", async (request, reply) => {
    const sig = request.headers["stripe-signature"];
    if (!sig) {
      return reply.code(400).send({ error: "Missing stripe-signature header" });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(
        request.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET_CONNECT!
      );
    } catch (err) {
      fastify.log.error(err, "[stripe-connect] signature verification failed");
      return reply.code(400).send({ error: "Webhook signature verification failed" });
    }

    // Every Connect event carries the connected account id at the top level
    const connectedAccountId = event.account ?? null;

    switch (event.type) {
      // ── Checkout ─────────────────────────────────────────────────────────────
      case "checkout.session.completed":
        console.log("[stripe-connect] checkout.session.completed", event.id, connectedAccountId);
        break;

      case "checkout.session.expired":
        console.log("[stripe-connect] checkout.session.expired", event.id, connectedAccountId);
        break;

      // ── Payment intents ──────────────────────────────────────────────────────
      case "payment_intent.succeeded":
        console.log("[stripe-connect] payment_intent.succeeded", event.id, connectedAccountId);
        break;

      case "payment_intent.payment_failed":
        console.log("[stripe-connect] payment_intent.payment_failed", event.id, connectedAccountId);
        break;

      // ── Invoices ─────────────────────────────────────────────────────────────
      case "invoice.payment_succeeded":
        console.log("[stripe-connect] invoice.payment_succeeded", event.id, connectedAccountId);
        break;

      case "invoice.payment_failed":
        console.log("[stripe-connect] invoice.payment_failed", event.id, connectedAccountId);
        break;

      case "invoice.finalized":
        console.log("[stripe-connect] invoice.finalized", event.id, connectedAccountId);
        break;

      // ── Setup intents ────────────────────────────────────────────────────────
      case "setup_intent.succeeded":
        console.log("[stripe-connect] setup_intent.succeeded", event.id, connectedAccountId);
        break;

      case "setup_intent.setup_failed":
        console.log("[stripe-connect] setup_intent.setup_failed", event.id, connectedAccountId);
        break;

      // ── Charges & disputes ───────────────────────────────────────────────────
      case "charge.refunded":
        console.log("[stripe-connect] charge.refunded", event.id, connectedAccountId);
        break;

      case "charge.dispute.created":
        console.log("[stripe-connect] charge.dispute.created", event.id, connectedAccountId);
        break;

      case "charge.dispute.updated":
        console.log("[stripe-connect] charge.dispute.updated", event.id, connectedAccountId);
        break;

      case "charge.dispute.closed":
        console.log("[stripe-connect] charge.dispute.closed", event.id, connectedAccountId);
        break;

      case "charge.dispute.funds_withdrawn":
        console.log("[stripe-connect] charge.dispute.funds_withdrawn", event.id, connectedAccountId);
        break;

      case "charge.dispute.funds_reinstated":
        console.log("[stripe-connect] charge.dispute.funds_reinstated", event.id, connectedAccountId);
        break;

      // ── Refunds ──────────────────────────────────────────────────────────────
      case "refund.created":
        console.log("[stripe-connect] refund.created", event.id, connectedAccountId);
        break;

      case "refund.updated":
        console.log("[stripe-connect] refund.updated", event.id, connectedAccountId);
        break;

      // ── Transfers ────────────────────────────────────────────────────────────
      case "transfer.created":
        console.log("[stripe-connect] transfer.created", event.id, connectedAccountId);
        break;

      case "transfer.reversed":
        console.log("[stripe-connect] transfer.reversed", event.id, connectedAccountId);
        break;

      // ── Connected account lifecycle ──────────────────────────────────────────
      case "account.updated":
        console.log("[stripe-connect] account.updated", event.id, connectedAccountId);
        break;

      case "account.application.deauthorized": {
        // Chef disconnected their Stripe account — clear payment_acct_id and raise support task
        fastify.log.warn(
          `[stripe-connect] account.application.deauthorized: ${connectedAccountId}`
        );

        const supabase = getSupabase();

        // Find the chef_profile that holds this Stripe account id
        const { data: chef, error: findError } = await supabase
          .from("chef_profiles")
          .select("id")
          .eq("payment_acct_id", connectedAccountId)
          .maybeSingle();

        if (findError) {
          fastify.log.error(findError, "[stripe-connect] deauthorized: chef lookup failed");
        }

        // Clear payment_acct_id regardless of whether we found a chef row
        const { error: updateError } = await supabase
          .from("chef_profiles")
          .update({ payment_acct_id: null })
          .eq("payment_acct_id", connectedAccountId);

        if (updateError) {
          fastify.log.error(updateError, "[stripe-connect] deauthorized: payment_acct_id clear failed");
        }

        // Create a support agent_task so the chef console shows a reconnect prompt
        if (chef) {
          const { error: taskError } = await supabase.from("agent_tasks").insert({
            chef_profile_id: chef.id,
            kind: "support",
            status: "proposed",
            summary: "Chef Stripe account disconnected — needs reconnection",
            payload: { disconnected_account_id: connectedAccountId },
          });

          if (taskError) {
            fastify.log.error(taskError, "[stripe-connect] deauthorized: agent_task insert failed");
          }
        }
        break;
      }

      case "account.external_account.created":
        console.log("[stripe-connect] account.external_account.created", event.id, connectedAccountId);
        break;

      case "account.external_account.updated":
        console.log("[stripe-connect] account.external_account.updated", event.id, connectedAccountId);
        break;

      // ── Capabilities & persons ───────────────────────────────────────────────
      case "capability.updated":
        console.log("[stripe-connect] capability.updated", event.id, connectedAccountId);
        break;

      case "person.created":
        console.log("[stripe-connect] person.created", event.id, connectedAccountId);
        break;

      case "person.updated":
        console.log("[stripe-connect] person.updated", event.id, connectedAccountId);
        break;

      case "person.deleted":
        console.log("[stripe-connect] person.deleted", event.id, connectedAccountId);
        break;

      // ── Payment methods ──────────────────────────────────────────────────────
      case "payment_method.attached":
        console.log("[stripe-connect] payment_method.attached", event.id, connectedAccountId);
        break;

      case "payment_method.detached":
        console.log("[stripe-connect] payment_method.detached", event.id, connectedAccountId);
        break;

      // ── Payment links ────────────────────────────────────────────────────────
      case "payment_link.created":
        console.log("[stripe-connect] payment_link.created", event.id, connectedAccountId);
        break;

      case "payment_link.updated":
        console.log("[stripe-connect] payment_link.updated", event.id, connectedAccountId);
        break;

      default:
        fastify.log.warn(`[stripe-connect] Unhandled event type: ${event.type}`);
    }

    return reply.code(200).send({ received: true });
  });
};
