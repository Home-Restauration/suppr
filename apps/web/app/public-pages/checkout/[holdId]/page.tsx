import React from "react";
import { notFound } from "next/navigation";
import { createApiClient } from "@suppr/contracts/client";
import type { EventCard, LineItems, HoldDetail } from "@suppr/contracts";
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

  let holdDetail: HoldDetail;
  try {
    holdDetail = await api.bookings.getHold(holdId);
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404 || status === 410) notFound();
    throw err;
  }

  const [eventData, quote] = await Promise.all([
    api.events.get(holdDetail.event_id),
    api.bookings.quote({
      event_id: holdDetail.event_id,
      ticket_type_id: holdDetail.ticket_type_id,
      qty: holdDetail.qty,
    }),
  ]);

  return {
    hold: {
      hold_id: holdDetail.hold_id,
      event_id: holdDetail.event_id,
      expires_at: holdDetail.expires_at,
      seats_held: holdDetail.qty,
    },
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
