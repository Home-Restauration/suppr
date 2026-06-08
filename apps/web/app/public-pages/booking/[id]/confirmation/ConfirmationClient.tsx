"use client";
import React, { useEffect, useRef, useState } from "react";
import { createApiClient } from "@suppr/contracts/client";
import type { Booking, EventCard } from "@suppr/contracts";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function addressRuleNote(rule: string, hours?: number | null): string {
  if (rule === "always") return "The exact address was sent immediately to your contact.";
  if (rule === "before_event") return `The exact address will be sent ${hours ?? 24}h before the event.`;
  return "The exact address will be sent once your booking is confirmed.";
}

function buildIcsDataUri(event: EventCard): string {
  const start = new Date(event.starts_at);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // assume 3h duration

  function icsDate(d: Date) {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Suppr//EN",
    "BEGIN:VEVENT",
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.approx_location}`,
    `DESCRIPTION:A Suppr dining experience by ${event.chef?.brand_name ?? "your chef"}.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}

// ── Polling constants ─────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2000;
const POLL_MAX = 10; // 20 s total

// ── Sub-components ────────────────────────────────────────────────────────────

function PendingState({ dots }: { dots: number }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: "40px 20px",
      }}
    >
      {/* Pulsing ring */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "2.5px solid var(--color-hairline)",
          borderTopColor: "var(--color-accent)",
          animation: "spin 1s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          color: "var(--color-text)",
          letterSpacing: "-0.01em",
        }}
      >
        Confirming your booking{"...".slice(0, (dots % 3) + 1)}
      </p>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)", maxWidth: 280, textAlign: "center" }}>
        Payment received. We're just waiting for the confirmation to land&thinsp;—&thinsp;this takes a moment.
      </p>
    </div>
  );
}

function TimeoutState({ bookingId }: { bookingId: string }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-note-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 6v4m0 4h.01" stroke="var(--color-note)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="10" cy="10" r="8.5" stroke="var(--color-note)" strokeWidth="1.4" />
        </svg>
      </div>
      <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", color: "var(--color-text)" }}>
        Still processing
      </p>
      <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", maxWidth: 320 }}>
        Your payment went through but the confirmation is taking longer than usual.
        You'll receive a text or email shortly. Booking ID:
      </p>
      <code
        style={{
          fontFamily: "monospace",
          fontSize: "var(--text-xs)",
          background: "var(--color-surface-2)",
          padding: "4px 10px",
          borderRadius: "var(--radius-sm)",
          color: "var(--color-text-2)",
          wordBreak: "break-all",
        }}
      >
        {bookingId}
      </code>
      <a href="/" style={{ marginTop: 8, fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "none" }}>
        ← Back to Suppr
      </a>
    </div>
  );
}

interface SuccessProps {
  booking: Booking;
  event: EventCard;
  priceCents: number;
}

function SuccessState({ booking, event, priceCents }: SuccessProps) {
  const chef = event.chef;
  const pricePerSeat = event.ticket_types?.[0]?.price_cents ?? 0;

  const lineRows: { label: string; cents: number }[] = [
    { label: `${booking.guest_count} seat${booking.guest_count > 1 ? "s" : ""} × ${fmtCents(pricePerSeat)}`, cents: pricePerSeat * booking.guest_count },
  ];
  // show platform note without exact fee (we don't have breakdown)
  const guestNames = (booking.guests ?? []).map((g) => g.name).filter(Boolean);

  const icsHref = buildIcsDataUri(event);

  return (
    <main style={{ minHeight: "100dvh", background: "var(--color-canvas)" }}>
      {/* Top nav */}
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "16px 20px 0" }}>
        <a
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", textDecoration: "none" }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Suppr
        </a>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 60px" }}>

        {/* ── Hero: checkmark ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "var(--color-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 14l6 6L22 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-3xl)",
              lineHeight: "var(--leading-3xl)",
              fontWeight: 500,
              color: "var(--color-text)",
              marginBottom: 8,
            }}
          >
            You're going.
          </h1>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Booking confirmed
          </p>
          <p
            style={{
              marginTop: 6,
              fontFamily: "monospace",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
              letterSpacing: "0.04em",
            }}
          >
            #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* ── Event card ── */}
        <section
          style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Event
          </p>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 500,
              color: "var(--color-text)",
              marginBottom: 6,
            }}
          >
            {event.title}
          </p>
          {chef && (
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginBottom: 14 }}>
              Hosted by {chef.brand_name} · {chef.city}
            </p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Row icon="calendar" label={fmtDate(event.starts_at)} />
            <Row icon="clock" label={fmtTime(event.starts_at)} />
            <Row icon="pin" label={event.approx_location} />
          </div>

          {/* Add to calendar */}
          <a
            href={icsHref}
            download={`suppr-${event.id.slice(0, 8)}.ics`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 16,
              fontSize: "var(--text-sm)",
              color: "var(--color-text-2)",
              textDecoration: "none",
              border: "0.5px solid var(--color-hairline)",
              borderRadius: "var(--radius-md)",
              padding: "7px 14px",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1" y="2.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 5.5h11M4 1v3M9 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Add to calendar
          </a>
        </section>

        {/* ── Guests ── */}
        <section
          style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Guests
          </p>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", marginBottom: guestNames.length > 0 ? 10 : 0 }}>
            Party of {booking.guest_count}
          </p>
          {guestNames.length > 0 && (
            <ol style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 4 }}>
              {guestNames.map((name, i) => (
                <li key={i} style={{ fontSize: "var(--text-sm)", color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--color-surface-2)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "var(--color-text-muted)", flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  {name}
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── Price ── */}
        <section
          style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: 12,
          }}
        >
          <p
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 12,
            }}
          >
            Receipt
          </p>

          {lineRows.map((r) => (
            <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{r.label}</span>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text)" }}>{fmtCents(r.cents)}</span>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "0.5px solid var(--color-hairline)",
              paddingTop: 10,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>Total paid</span>
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)" }}>{fmtCents(priceCents)}</span>
          </div>
        </section>

        {/* ── Address + notifications ── */}
        <section
          style={{
            background: "var(--color-surface)",
            border: "0.5px solid var(--color-hairline)",
            borderRadius: "var(--radius-lg)",
            padding: "20px 24px",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <InfoRow
            icon="pin-outline"
            text={addressRuleNote(event.address_rule, event.address_release_hours)}
          />
          <InfoRow
            icon="message"
            text={
              booking.buyer_email
                ? `Confirmation sent to ${booking.buyer_email}${booking.buyer_phone ? ` and ${booking.buyer_phone}` : ""}.`
                : booking.buyer_phone
                  ? `Confirmation sent to ${booking.buyer_phone}.`
                  : "Confirmation details added to your booking."
            }
          />
        </section>

        {/* ── Footer CTA ── */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <a
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 28px",
              background: "var(--color-text)",
              color: "var(--color-canvas)",
              borderRadius: "var(--radius-md)",
              fontSize: "var(--text-sm)",
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "var(--font-sans)",
            }}
          >
            Explore more events
          </a>
        </div>
      </div>
    </main>
  );
}

// ── Tiny icon rows ────────────────────────────────────────────────────────────

function Row({ icon, label }: { icon: "calendar" | "clock" | "pin"; label: string }) {
  const paths: Record<string, React.ReactNode> = {
    calendar: (
      <>
        <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M2 6.5h12M5 1.5v3M11 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </>
    ),
    clock: (
      <>
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 5v3.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    pin: (
      <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6C12.5 3.515 10.485 1.5 8 1.5zM8 7.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" fill="currentColor" />
    ),
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: "var(--color-text-muted)" }}>
        {paths[icon]}
      </svg>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>{label}</span>
    </div>
  );
}

function InfoRow({ icon, text }: { icon: "pin-outline" | "message"; text: string }) {
  const paths: Record<string, React.ReactNode> = {
    "pin-outline": (
      <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.75 4.5 8.5 4.5 8.5S12.5 9.75 12.5 6C12.5 3.515 10.485 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
    ),
    message: (
      <>
        <path d="M2.5 3.5h11a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 2v-2.5A1 1 0 011.5 10V4.5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" />
      </>
    ),
  };
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1, color: "var(--color-accent)" }}>
        {paths[icon]}
      </svg>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

// ── Main client component ─────────────────────────────────────────────────────

interface Props {
  bookingId: string;
  initialBooking: Booking;
  initialEvent: EventCard | null;
}

export function ConfirmationClient({ bookingId, initialBooking, initialEvent }: Props) {
  const [booking, setBooking] = useState<Booking>(initialBooking);
  const [event, setEvent] = useState<EventCard | null>(initialEvent);
  const [timedOut, setTimedOut] = useState(false);
  const [dots, setDots] = useState(1);
  const pollCount = useRef(0);

  const api = createApiClient({ baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "" });

  // Animate dots on pending state
  useEffect(() => {
    if (booking.status !== "pending") return;
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 600);
    return () => clearInterval(id);
  }, [booking.status]);

  // Poll until confirmed or timeout
  useEffect(() => {
    if (booking.status !== "pending") return;

    const id = setInterval(async () => {
      pollCount.current += 1;

      if (pollCount.current > POLL_MAX) {
        clearInterval(id);
        setTimedOut(true);
        return;
      }

      try {
        const fresh = await api.bookings.get(bookingId);
        setBooking(fresh);

        if (fresh.status === "confirmed") {
          clearInterval(id);
          // Fetch event data now that we're confirmed
          if (!event) {
            try {
              const ev = await api.events.get(fresh.event_id) as unknown as EventCard;
              setEvent(ev);
            } catch { /* show without event details */ }
          }
        }
      } catch {
        // transient error — keep polling
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally only on mount

  if (timedOut) return <TimeoutState bookingId={bookingId} />;
  if (booking.status === "pending") return <PendingState dots={dots} />;
  if (booking.status !== "confirmed") {
    // cancelled / transferred — show neutral state
    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-canvas)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "40px 20px", maxWidth: 400 }}>
          <p style={{ fontSize: "var(--text-lg)", color: "var(--color-text-2)", marginBottom: 16 }}>
            This booking is {booking.status}.
          </p>
          <a href="/" style={{ fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "none" }}>
            ← Back to Suppr
          </a>
        </div>
      </main>
    );
  }

  // Prefer the Stripe-authoritative total stamped by the webhook (migration 0024).
  // Fall back to price × qty for bookings created before the migration.
  const pricePerSeat = event?.ticket_types?.[0]?.price_cents ?? 0;
  const priceCents = booking.total_cents ?? (pricePerSeat * booking.guest_count);

  if (!event) {
    // Confirmed but event didn't load — show minimal success
    return (
      <main style={{ minHeight: "100dvh", background: "var(--color-canvas)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "40px 20px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", color: "var(--color-text)" }}>You're going.</p>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-2)" }}>
          Booking confirmed — #{booking.id.slice(0, 8).toUpperCase()}
        </p>
        <a href="/" style={{ marginTop: 8, fontSize: "var(--text-sm)", color: "var(--color-accent)", textDecoration: "none" }}>Explore more events →</a>
      </main>
    );
  }

  return <SuccessState booking={booking} event={event} priceCents={priceCents} />;
}
