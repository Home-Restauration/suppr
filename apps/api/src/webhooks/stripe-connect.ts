import type { FastifyInstance, FastifyPluginAsync } from "fastify";
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

// ── Fulfillment helpers ───────────────────────────────────────────────────────
// Shared by both platform (stripe.ts) and connect (stripe-connect.ts) handlers
// so fulfillment works regardless of whether we use destination or direct charges.

export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  fastify: FastifyInstance
): Promise<void> {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    fastify.log.warn("[stripe] checkout.session.completed: no booking_id in metadata");
    return;
  }

  const supabase = getSupabase();

  // Idempotency — Stripe retries webhooks; skip if already fulfilled
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (existing) {
    fastify.log.info(`[stripe] already fulfilled booking ${bookingId}, skipping`);
    return;
  }

  // Amounts from metadata (written by POST /bookings when session was created)
  const subtotalCents      = parseInt(session.metadata?.subtotal_cents       ?? "0", 10);
  const taxCents           = parseInt(session.metadata?.tax_cents             ?? "0", 10);
  const gratuityReqCents   = parseInt(session.metadata?.gratuity_req_cents    ?? "0", 10);
  const gratuityExtraCents = parseInt(session.metadata?.gratuity_extra_cents  ?? "0", 10);
  const platformFeeCents   = parseInt(session.metadata?.platform_fee_cents    ?? "0", 10);
  const processorFeeCents  = parseInt(session.metadata?.processor_fee_cents   ?? "0", 10);
  const totalCents         = session.amount_total ?? 0;
  const payoutCents        = totalCents - platformFeeCents - processorFeeCents;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : (session.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  // Write payment record
  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id:          bookingId,
    provider:            "stripe",
    provider_payment_id: paymentIntentId,
    subtotal_cents:      subtotalCents,
    tax_cents:           taxCents,
    gratuity_req_cents:  gratuityReqCents,
    gratuity_extra_cents: gratuityExtraCents,
    platform_fee_cents:  platformFeeCents,
    processor_fee_cents: processorFeeCents,
    refund_cents:        0,
    payout_cents:        payoutCents,
    status:              "paid",
  });

  if (paymentError) {
    fastify.log.error(paymentError, `[stripe] payments insert failed for booking ${bookingId}`);
    return;
  }

  // Confirm the booking and stamp the Stripe-authoritative total
  await supabase
    .from("bookings")
    .update({ status: "confirmed", total_cents: totalCents })
    .eq("id", bookingId);

  // Enqueue confirmation notifications (email + SMS if available)
  const { data: booking } = await supabase
    .from("bookings")
    .select("buyer_email, buyer_phone, buyer_name, event_id")
    .eq("id", bookingId)
    .single();

  const { data: event } = await supabase
    .from("events")
    .select("title, starts_at")
    .eq("id", booking?.event_id)
    .single();

  const notifications: Array<Record<string, unknown>> = [];
  if (booking?.buyer_email) {
    notifications.push({
      channel: "email",
      template: "booking_confirmation",
      to: booking.buyer_email,
      guestName: booking.buyer_name,
      eventTitle: event?.title ?? "",
      eventDate: event?.starts_at ?? "",
      bookingId,
      totalCents,
    });
  }
  if (booking?.buyer_phone) {
    notifications.push({
      channel: "sms",
      to: booking.buyer_phone,
      message: `Your booking for ${event?.title ?? "the event"} is confirmed! Ref: ${bookingId.slice(0, 8)}`,
    });
  }

  for (const msg of notifications) {
    await supabase
      .rpc("pgmq_send", { queue_name: "notifications", message: msg })
      .then(({ error: e }) => {
        if (e) fastify.log.warn(`[stripe] pgmq_send failed: ${e.message}`);
      });
  }

  fastify.log.info(`[stripe] booking ${bookingId} confirmed, ${totalCents / 100} USD`);
}

export async function expireCheckoutSession(
  session: Stripe.Checkout.Session,
  fastify: FastifyInstance
): Promise<void> {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  const supabase = getSupabase();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "pending");

  if (error) fastify.log.error(error, `[stripe] expire: booking update failed for ${bookingId}`);
  else fastify.log.info(`[stripe] booking ${bookingId} expired → cancelled`);
}

export async function handleChargeRefunded(
  charge: Stripe.Charge,
  fastify: FastifyInstance
): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;
  if (!paymentIntentId) return;

  const supabase = getSupabase();

  // Look up the payment row first (need booking_id for the booking update)
  const { data: payment } = await supabase
    .from("payments")
    .select("id, booking_id")
    .eq("provider_payment_id", paymentIntentId)
    .maybeSingle();

  if (!payment) {
    fastify.log.warn(`[stripe] charge.refunded: no payment row for PI ${paymentIntentId}`);
    return;
  }

  const refundCents = charge.amount_refunded;
  const isFullRefund = charge.refunded;
  const newStatus = isFullRefund ? "refunded" : "partially_refunded";

  await supabase
    .from("payments")
    .update({ refund_cents: refundCents, status: newStatus })
    .eq("id", payment.id);

  if (isFullRefund) {
    await supabase
      .from("bookings")
      .update({ status: "refunded" })
      .eq("id", payment.booking_id);
    fastify.log.info(`[stripe] booking ${payment.booking_id} fully refunded`);
  } else {
    fastify.log.info(`[stripe] booking ${payment.booking_id} partially refunded: ${refundCents} cents`);
  }
}

// ── Connect webhook route ─────────────────────────────────────────────────────

export const stripeConnectWebhookRoute: FastifyPluginAsync = async (fastify) => {
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

    const connectedAccountId = event.account ?? null;

    switch (event.type) {
      // ── Checkout ─────────────────────────────────────────────────────────────
      case "checkout.session.completed":
        // Fires here for direct charges (on_behalf_of connected account).
        // For destination charges the same event fires in stripe.ts (platform).
        // fulfillCheckoutSession is idempotent — safe to handle in both.
        await fulfillCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
          fastify
        );
        break;

      case "checkout.session.expired":
        await expireCheckoutSession(
          event.data.object as Stripe.Checkout.Session,
          fastify
        );
        break;

      // ── Payment intents ──────────────────────────────────────────────────────
      case "payment_intent.succeeded":
        fastify.log.info(`[stripe-connect] payment_intent.succeeded ${event.id} acct=${connectedAccountId}`);
        break;

      case "payment_intent.payment_failed":
        // In Checkout, a failed attempt doesn't close the session — guest can retry.
        // Log for observability; don't cancel the booking here.
        fastify.log.warn(`[stripe-connect] payment_intent.payment_failed ${event.id} acct=${connectedAccountId}`);
        break;

      // ── Invoices ─────────────────────────────────────────────────────────────
      case "invoice.payment_succeeded":
        fastify.log.info(`[stripe-connect] invoice.payment_succeeded ${event.id}`);
        break;

      case "invoice.payment_failed":
        fastify.log.warn(`[stripe-connect] invoice.payment_failed ${event.id}`);
        break;

      case "invoice.finalized":
        fastify.log.info(`[stripe-connect] invoice.finalized ${event.id}`);
        break;

      // ── Setup intents ────────────────────────────────────────────────────────
      case "setup_intent.succeeded":
      case "setup_intent.setup_failed":
        fastify.log.info(`[stripe-connect] ${event.type} ${event.id}`);
        break;

      // ── Charges & disputes ───────────────────────────────────────────────────
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge, fastify);
        break;

      case "charge.dispute.created":
        fastify.log.warn(`[stripe-connect] dispute.created ${event.id} acct=${connectedAccountId}`);
        break;

      case "charge.dispute.updated":
      case "charge.dispute.closed":
      case "charge.dispute.funds_withdrawn":
      case "charge.dispute.funds_reinstated":
        fastify.log.info(`[stripe-connect] ${event.type} ${event.id}`);
        break;

      // ── Refunds ──────────────────────────────────────────────────────────────
      case "refund.created":
      case "refund.updated":
        fastify.log.info(`[stripe-connect] ${event.type} ${event.id}`);
        break;

      // ── Transfers ────────────────────────────────────────────────────────────
      case "transfer.created":
      case "transfer.reversed":
        fastify.log.info(`[stripe-connect] ${event.type} ${event.id}`);
        break;

      // ── Connected account lifecycle ──────────────────────────────────────────
      case "account.updated":
        fastify.log.info(`[stripe-connect] account.updated ${connectedAccountId}`);
        break;

      case "account.application.deauthorized": {
        fastify.log.warn(`[stripe-connect] account.application.deauthorized: ${connectedAccountId}`);
        const supabase = getSupabase();
        const { data: chef } = await supabase
          .from("chef_profiles")
          .select("id")
          .eq("payment_acct_id", connectedAccountId)
          .maybeSingle();

        await supabase
          .from("chef_profiles")
          .update({ payment_acct_id: null })
          .eq("payment_acct_id", connectedAccountId);

        if (chef) {
          await supabase.from("agent_tasks").insert({
            chef_profile_id: chef.id,
            kind: "support",
            status: "proposed",
            summary: "Chef Stripe account disconnected — needs reconnection",
            payload: { disconnected_account_id: connectedAccountId },
          });
        }
        break;
      }

      case "account.external_account.created":
      case "account.external_account.updated":
      case "capability.updated":
      case "person.created":
      case "person.updated":
      case "person.deleted":
      case "payment_method.attached":
      case "payment_method.detached":
      case "payment_link.created":
      case "payment_link.updated":
        fastify.log.info(`[stripe-connect] ${event.type} ${event.id}`);
        break;

      default:
        fastify.log.warn(`[stripe-connect] Unhandled event type: ${event.type}`);
    }

    return reply.code(200).send({ received: true });
  });
};
