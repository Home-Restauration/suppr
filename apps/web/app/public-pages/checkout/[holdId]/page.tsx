import React from "react";
import { notFound } from "next/navigation";
import { createApiClient } from "@suppr/contracts/client";
import type { EventCard, LineItems } from "@suppr/contracts";
import { CheckoutFlow } from "./CheckoutFlow.js";

export const dynamic = "force-dynamic";

interface Props {
  params: { holdId: string };
}

interface HoldData {
  hold_id: string;
  expires_at: string;
  seats_held: number;
  event_id: string;
}

async function loadCheckout(holdId: string): Promise<{
  hold: HoldData;
  event: EventCard;
  lineItems: LineItems;
}> {
  const api = createApiClient({ baseUrl: process.env.API_URL! });

  // The hold endpoint returns the hold + event id. We need to get the event
  // and a quote for the line items display.
  //
  // Using the hold endpoint via quote: the quote endpoint accepts hold_id
  // indirectly via event_id. We load the event from the hold's event_id.
  //
  // Note: a dedicated GET /bookings/holds/:id endpoint would be cleaner — if
  // one is added to contracts, swap this out. For now we derive from the hold
  // response shape embedded in the create flow.

  // The API client exposes bookings.hold (POST) but not GET. We call quote
  // with known params, but we first need to know event_id and ticket_type_id
  // from the hold. Since the client doesn't expose GET /holds/:id yet, we
  // work with what's available: the hold response was stored in the URL from
  // the BookingCard redirect. We expect the holdId to resolve via the existing
  // quote endpoint when passed as part of the request.
  //
  // Practical: for the mock/real API, a GET /bookings/holds/:id would return
  // { hold_id, event_id, ticket_type_id, qty, expires_at }. We use a custom
  // fetch here since the typed client doesn't yet include this endpoint.

  const holdRes = await fetch(`${process.env.API_URL}/bookings/holds/${holdId}`, {
    cache: "no-store",
  });

  if (holdRes.status === 404 || holdRes.status === 410) notFound();
  if (!holdRes.ok) throw new Error(`Hold fetch failed: ${holdRes.status}`);

  const hold: HoldData & { ticket_type_id: string; qty: number } = await holdRes.json();

  const [eventData, quote] = await Promise.all([
    api.events.get(hold.event_id),
    api.bookings.quote({
      event_id: hold.event_id,
      ticket_type_id: hold.ticket_type_id,
      qty: hold.qty,
    }),
  ]);

  return {
    hold: { ...hold, seats_held: hold.qty },
    event: eventData as unknown as EventCard,
    lineItems: quote,
  };
}

export default async function CheckoutPage({ params }: Props) {
  let hold: HoldData;
  let event: EventCard;
  let lineItems: LineItems;

  try {
    ({ hold, event, lineItems } = await loadCheckout(params.holdId));
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404 || status === 410) notFound();

    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)" }}>
            This checkout couldn't be loaded. Please try again.
          </p>
          <a href="/" style={{ display: "inline-block", marginTop: 16, fontSize: "var(--text-sm)", color: "var(--color-accent)" }}>
            ← Back to feed
          </a>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      {/* Back nav */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 20px 0" }}>
        <a
          href={`/public-pages/events/${event.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: "var(--text-sm)",
            color: "var(--color-text-muted)",
            textDecoration: "none",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {event.title}
        </a>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 20px 80px" }}>
        <CheckoutFlow
          holdId={params.holdId}
          expiresAt={hold.expires_at}
          seatsHeld={hold.seats_held}
          event={event}
          lineItems={lineItems}
        />
      </div>
    </main>
  );
}
