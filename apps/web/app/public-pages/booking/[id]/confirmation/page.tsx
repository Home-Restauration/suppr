import React from "react";
import { notFound } from "next/navigation";
import { createApiClient } from "@suppr/contracts/client";
import type { Booking, EventCard } from "@suppr/contracts";
import { ConfirmationClient } from "./ConfirmationClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

async function loadInitialData(bookingId: string): Promise<{
  booking: Booking;
  event: EventCard | null;
}> {
  const api = createApiClient({ baseUrl: process.env.API_URL! });
  const booking = await api.bookings.get(bookingId);

  let event: EventCard | null = null;
  if (booking.status === "confirmed" || booking.status === "pending") {
    try {
      event = await api.events.get(booking.event_id) as unknown as EventCard;
    } catch {
      // event fetch fails gracefully — confirmation still shows
    }
  }

  return { booking, event };
}

export default async function ConfirmationPage({ params }: Props) {
  let booking: Booking;
  let event: EventCard | null;

  try {
    ({ booking, event } = await loadInitialData(params.id));
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 404) notFound();
    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 400 }}>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)", marginBottom: 16 }}>
            Something went wrong loading your booking.
          </p>
          <a href="/" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "none" }}>
            ← Back to Suppr
          </a>
        </div>
      </main>
    );
  }

  return <ConfirmationClient bookingId={params.id} initialBooking={booking} initialEvent={event} />;
}
