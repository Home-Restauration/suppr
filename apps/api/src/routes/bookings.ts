import type { FastifyInstance } from "fastify";
import Stripe from "stripe";
import { createServiceClient } from "../lib/supabase.js";
import { extractUser } from "../lib/auth.js";
import {
  QuoteRequestSchema, HoldRequestSchema,
  CreateBookingRequestSchema, ModifyBookingRequestSchema,
} from "@suppr/contracts/schemas";
import { computeLineItems } from "@suppr/core";

// Platform fee per booking by tier (integer cents)
const PLATFORM_FEE: Record<string, number> = { basic: 200, chef_ai: 150 };

function buildLineItems(
  pricePerSeat: number,
  qty: number,
  extraTipCents: number,
  taxEnabled: boolean,
  gratuityRequiredPct: number | null,
  gratuityBeforeTax: boolean,
  chefTier: string
) {
  const platformFeeCents = PLATFORM_FEE[chefTier] ?? PLATFORM_FEE.basic;
  const result = computeLineItems({
    price_cents: pricePerSeat,
    qty,
    tax_enabled: taxEnabled,
    gratuity_required_pct: gratuityRequiredPct,
    gratuity_before_tax: gratuityBeforeTax,
    extra_tip_cents: extraTipCents,
    platform_fee_cents: platformFeeCents,
  });

  // Build breakdown array expected by contracts LineItemsSchema
  const breakdown = [
    { label: `Seat × ${qty}`, amount_cents: result.subtotal_cents, type: "seat" as const },
    ...(result.tax_cents > 0 ? [{ label: "Tax", amount_cents: result.tax_cents, type: "tax" as const }] : []),
    ...(result.gratuity_required_cents > 0 ? [{ label: "Service gratuity", amount_cents: result.gratuity_required_cents, type: "gratuity_required" as const }] : []),
    ...(result.gratuity_extra_cents > 0 ? [{ label: "Additional tip", amount_cents: result.gratuity_extra_cents, type: "gratuity_extra" as const }] : []),
    { label: "Platform fee", amount_cents: result.platform_fee_cents, type: "platform_fee" as const },
    { label: "Processing fee", amount_cents: result.processor_fee_cents, type: "processor_fee" as const },
  ];

  return {
    subtotal_cents: result.subtotal_cents,
    tax_cents: result.tax_cents,
    gratuity_required_cents: result.gratuity_required_cents,
    gratuity_extra_cents: result.gratuity_extra_cents,
    platform_fee_cents: result.platform_fee_cents,
    processor_fee_cents: result.processor_fee_cents,
    total_cents: result.total_cents,
    breakdown,
  };
}

export async function bookingsRoute(app: FastifyInstance) {
  const db = createServiceClient();
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });

  // POST /bookings/quote — price breakdown without creating a hold
  app.post("/bookings/quote", async (request, reply) => {
    const body = QuoteRequestSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const { event_id, ticket_type_id, qty, extra_tip_cents = 0 } = body.data;

    const { data: event, error } = await db
      .from("events")
      .select("tax_enabled, gratuity_required_pct, gratuity_before_tax, ticket_types(*), chef_profiles(tier)")
      .eq("id", event_id)
      .single();
    if (error || !event) return reply.status(404).send({ error: "Event not found" });

    const ticketType = (event.ticket_types as any[]).find((t: any) => t.id === ticket_type_id);
    if (!ticketType) return reply.status(404).send({ error: "Ticket type not found" });

    const chefTier = (event.chef_profiles as any)?.tier ?? "basic";
    reply.send(buildLineItems(
      ticketType.price_cents, qty, extra_tip_cents,
      event.tax_enabled, event.gratuity_required_pct,
      event.gratuity_before_tax, chefTier
    ));
  });

  // POST /bookings/hold — reserve seats for 10 min
  app.post("/bookings/hold", async (request, reply) => {
    const body = HoldRequestSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const { event_id, ticket_type_id, qty } = body.data;

    const { data: event } = await db
      .from("events")
      .select("capacity")
      .eq("id", event_id)
      .single();
    if (!event) return reply.status(404).send({ error: "Event not found" });

    const { data: bookingsAgg } = await db
      .from("bookings")
      .select("guest_count")
      .eq("event_id", event_id)
      .in("status", ["pending", "confirmed"]);

    const taken = (bookingsAgg ?? []).reduce((s: number, b: any) => s + b.guest_count, 0);
    if (taken + qty > (event as any).capacity) {
      return reply.status(409).send({ error: "Not enough seats available" });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { data: hold, error } = await db
      .from("seat_holds")
      .insert({ event_id, ticket_type_id, qty, expires_at: expiresAt })
      .select()
      .single();

    if (error) return reply.status(500).send({ error: error.message });

    reply.send({ hold_id: (hold as any).id, expires_at: expiresAt, seats_held: qty });
  });

  // GET /bookings/holds/:id — fetch hold details for checkout page (public, no auth)
  app.get<{ Params: { id: string } }>("/bookings/holds/:id", async (request, reply) => {
    const { data: hold } = await db
      .from("seat_holds")
      .select("id, event_id, ticket_type_id, qty, expires_at")
      .eq("id", request.params.id)
      .single();

    if (!hold) return reply.status(404).send({ error: "Hold not found" });
    if (new Date((hold as any).expires_at) < new Date()) {
      return reply.status(410).send({ error: "Hold expired" });
    }

    const h = hold as any;
    reply.send({
      hold_id: h.id,
      event_id: h.event_id,
      ticket_type_id: h.ticket_type_id,
      qty: h.qty,
      expires_at: h.expires_at,
    });
  });

  // POST /bookings — create booking, no account required (name + email or phone)
  app.post("/bookings", async (request, reply) => {
    const body = CreateBookingRequestSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });
    const { hold_id, buyer_name, buyer_email, buyer_phone, guests, extra_tip_cents = 0, channel } = body.data;

    if (!buyer_email && !buyer_phone) {
      return reply.status(400).send({ error: "buyer_email or buyer_phone required" });
    }

    const { data: hold } = await db
      .from("seat_holds")
      .select("*")
      .eq("id", hold_id)
      .single();

    if (!hold || new Date((hold as any).expires_at) < new Date()) {
      return reply.status(410).send({ error: "Hold expired" });
    }
    const h = hold as any;

    const { data: event } = await db
      .from("events")
      .select("tax_enabled, gratuity_required_pct, gratuity_before_tax, ticket_types(*), chef_profiles(tier, payment_acct_id)")
      .eq("id", h.event_id)
      .single();
    if (!event) return reply.status(404).send({ error: "Event not found" });

    const ev = event as any;
    const ticketType = (ev.ticket_types as any[]).find((t: any) => t.id === h.ticket_type_id);
    const chefTier = ev.chef_profiles?.tier ?? "basic";
    const paymentAcctId: string | null = ev.chef_profiles?.payment_acct_id ?? null;

    const lineItems = buildLineItems(
      ticketType.price_cents, h.qty, extra_tip_cents,
      ev.tax_enabled, ev.gratuity_required_pct,
      ev.gratuity_before_tax, chefTier
    );

    const auth = await extractUser(request);
    const userId = auth?.user.id ?? null;

    const { data: booking, error: bookingError } = await db
      .from("bookings")
      .insert({
        event_id: h.event_id,
        user_id: userId,
        buyer_name,
        buyer_email: buyer_email ?? null,
        buyer_phone: buyer_phone ?? null,
        guest_count: h.qty,
        status: "pending",
        channel,
      })
      .select()
      .single();

    if (bookingError) return reply.status(500).send({ error: bookingError.message });
    const bk = booking as any;

    if (guests.length > 0) {
      await db.from("booking_guests").insert(
        guests.map((g, i) => ({
          booking_id: bk.id,
          seat_number: i + 1,
          name: g.name,
          email: g.email ?? null,
          phone: g.phone ?? null,
          allergens: g.allergens,
          dietary: g.dietary,
          notes: g.notes ?? null,
        }))
      );
    }

    await db.from("seat_holds").delete().eq("id", hold_id);

    const successUrl = `${process.env.APP_URL}/booking/${bk.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.APP_URL}/events/${h.event_id}`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: buyer_email,
      metadata: {
        booking_id: bk.id,
        subtotal_cents:      String(lineItems.subtotal_cents),
        tax_cents:           String(lineItems.tax_cents),
        gratuity_req_cents:  String(lineItems.gratuity_required_cents),
        gratuity_extra_cents:String(lineItems.gratuity_extra_cents),
        platform_fee_cents:  String(lineItems.platform_fee_cents),
        processor_fee_cents: String(lineItems.processor_fee_cents),
      },
      line_items: lineItems.breakdown.map((item) => ({
        price_data: {
          currency: "usd",
          unit_amount: item.amount_cents,
          product_data: { name: item.label },
        },
        quantity: 1,
      })),
    };

    if (paymentAcctId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: lineItems.platform_fee_cents + lineItems.processor_fee_cents,
        transfer_data: { destination: paymentAcctId },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    reply.send({
      booking_id: bk.id,
      checkout_url: session.url!,
      expires_at: new Date(session.expires_at * 1000).toISOString(),
    });
  });

  // GET /bookings/:id
  app.get<{ Params: { id: string } }>("/bookings/:id", async (request, reply) => {
    const { data, error } = await db
      .from("bookings")
      .select("*, booking_guests(*)")
      .eq("id", request.params.id)
      .single();

    if (error || !data) return reply.status(404).send({ error: "Not found" });
    reply.send(data);
  });

  // POST /bookings/:id/modify
  app.post<{ Params: { id: string } }>("/bookings/:id/modify", async (request, reply) => {
    const body = ModifyBookingRequestSchema.safeParse(request.body);
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() });

    const { data: booking } = await db
      .from("bookings")
      .select("*")
      .eq("id", request.params.id)
      .single();

    if (!booking) return reply.status(404).send({ error: "Not found" });

    // TODO: apply packages/core policy engine to compute refund eligibility
    reply.send({
      allowed: true,
      refund_cents: 0,
      message: "Modification request received — processed by support within 24 h",
    });
  });

  // POST /waitlist
  app.post("/waitlist", async (request, reply) => {
    const { event_id, contact, channel } = request.body as any;
    if (!event_id || !contact) return reply.status(400).send({ error: "event_id and contact required" });

    const { error } = await db.from("waitlist_entries").insert({ event_id, contact, channel });
    if (error) return reply.status(500).send({ error: error.message });
    reply.send({ ok: true });
  });
}
